// editor.ts
import { Editor, defaultValueCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/core'
import { listenerCtx } from '@milkdown/plugin-listener'
import { createEmitter } from './emitter'
import { internalHandles } from './internal'
import { basePlugins } from './presets/base'
import { createHandle } from './handle'
import type { CreateEditorOptions, EditorHandle } from './types'

interface ChangeGate {
  /** setMarkdown 同步窗口内吞掉 listener 回调 */
  silence: boolean
  timer: ReturnType<typeof setTimeout> | undefined
  pending: { md: string; json: Record<string, unknown> } | undefined
}

export async function createEditor(options: CreateEditorOptions): Promise<EditorHandle> {
  const { root, defaultValue = '' } = options
  const readOnlyRef = { current: false }
  const emitter = createEmitter()
  const gate: ChangeGate = { silence: false, timer: undefined, pending: undefined }

  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, defaultValue)
      // editable 仅在创建时读取 → 用可变闭包支持运行时 setReadOnly
      ctx.update(editorViewOptionsCtx, (prev) => ({ ...prev, editable: () => !readOnlyRef.current }))
      root.classList.add('mdeditor')
      ctx.get(listenerCtx).selectionUpdated((_ctx, selection) => {
        emitter.emit('selectionChange', { from: selection.from, to: selection.to, empty: selection.empty })
      })
    })
    .use(basePlugins())
    .create()

  const handle = createHandle(editor, emitter, options, readOnlyRef, gate)
  internalHandles.set(handle, { editor, readOnlyRef })
  return handle
}
