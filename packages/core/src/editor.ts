// editor.ts
import { Editor, defaultValueCtx, editorViewOptionsCtx, rootCtx, serializerCtx } from '@milkdown/core'
import type { MilkdownPlugin } from '@milkdown/ctx'
import { listenerCtx } from '@milkdown/plugin-listener'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { $prose } from '@milkdown/utils'
import { createEmitter } from './emitter'
import { internalHandles } from './internal'
import { basePlugins } from './presets/base'
import { featureLoaders } from './presets/index'
import { createHandle } from './handle'
import { createSlashPlugin } from './slash'
import type { CreateEditorOptions, EditorError, EditorHandle } from './types'

interface ChangeGate {
  /** setMarkdown 同步窗口内吞掉 listener 回调 */
  silence: boolean
  timer: ReturnType<typeof setTimeout> | undefined
  pending: { md: string; json: Record<string, unknown> } | undefined
}

export async function createEditor(options: CreateEditorOptions): Promise<EditorHandle> {
  const { root, defaultValue = '' } = options
  const debounce = options.onChangeDebounce ?? 300
  const readOnlyRef = { current: false }
  const emitter = createEmitter()
  const gate: ChangeGate = { silence: false, timer: undefined, pending: undefined }

  const onError = (error: EditorError) => {
    console.warn(`[mdeditor:${error.source}]`, error.cause)
    emitter.emit('error', error)
  }
  if (options.onChange) emitter.on('change', options.onChange)
  if (options.onError) emitter.on('error', options.onError)

  // feature preset 装配：单个失败 → 禁用该 feature，不影响其余（spec §8）
  const plugins: MilkdownPlugin[] = [...basePlugins()]
  const features = options.features ?? {}
  for (const [name, loader] of Object.entries(featureLoaders)) {
    if (!features[name as keyof typeof features]) continue
    try {
      plugins.push(...loader({ onError, ...(options.onUploadImage ? { onUploadImage: options.onUploadImage } : {}) }))
    } catch (cause) {
      onError({ source: `preset:${name}`, cause })
    }
  }

  // 同步变更检测插件：绕过 listener.markdownUpdated 的 200ms lodash debounce（spec §5.1 要求 debounce=0 同步）。
  // view.update(view, prevState) 在 view.dispatch 内同步触发，故 debounce===0 时 onChange 真正同步交付。
  let prevMarkdown: string | null = null
  const changePlugin = $prose((ctx) =>
    new Plugin({
      key: new PluginKey('mdeditor-change'),
      view: () => ({
        update(view, prevState) {
          if (view.state.doc.eq(prevState.doc)) return
          let md: string
          try {
            md = ctx.get(serializerCtx)(view.state.doc)
          } catch {
            return
          }
          if (md === prevMarkdown) return
          prevMarkdown = md
          if (gate.silence) return
          const json = view.state.doc.toJSON() as Record<string, unknown>
          if (debounce === 0) {
            emitter.emit('change', md, json)
            return
          }
          gate.pending = { md, json }
          if (gate.timer) clearTimeout(gate.timer)
          gate.timer = setTimeout(() => {
            const p = gate.pending
            gate.pending = undefined
            if (p) emitter.emit('change', p.md, p.json)
          }, debounce)
        },
        destroy() {},
      }),
    }),
  )
  plugins.push(changePlugin)

  // slashTrigger：默认开；features.slash === false 时不装插件、不发事件（spec §5.2）
  if (features.slash !== false) {
    plugins.push(createSlashPlugin((payload) => emitter.emit('slashTrigger', payload)))
  }

  // image 上传钩子（spec §6.1）：onUploadImage 存在时才装载占位节点 + 粘贴/拖拽入口。
  // 动态 import 避免未传钩子时的模块开销。不走 featureLoaders——image 由 option 直接驱动，非 feature flag。
  if (options.onUploadImage) {
    const { createImageUploadPlugins } = await import('./presets/image')
    plugins.push(...createImageUploadPlugins({ onError, onUploadImage: options.onUploadImage }))
  }

  let editor: Editor
  try {
    editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, defaultValue)
        ctx.update(editorViewOptionsCtx, (prev) => ({ ...prev, editable: () => !readOnlyRef.current }))
        root.classList.add('mdeditor')
        ctx.get(listenerCtx).selectionUpdated((_c, selection) => {
          emitter.emit('selectionChange', { from: selection.from, to: selection.to, empty: selection.empty })
        })
      })
      .use(plugins)
      .create()
  } catch (cause) {
    onError({ source: 'editor:create', cause })
    throw cause
  }

  const handle = createHandle(editor, emitter, options, readOnlyRef, gate)
  internalHandles.set(handle, { editor, readOnlyRef })
  return handle
}
