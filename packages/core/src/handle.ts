// handle.ts
import type { Editor } from '@milkdown/core'
import { editorViewCtx } from '@milkdown/core'
import { getMarkdown, insert, replaceAll } from '@milkdown/utils'
import type { Emitter } from './emitter'
import { dispatchCommand } from './commands/dispatch'
import type { CreateEditorOptions, EditorEvent, EditorEventMap, EditorHandle } from './types'

interface ChangeGate {
  silence: boolean
  timer: ReturnType<typeof setTimeout> | undefined
  pending: { md: string; json: Record<string, unknown> } | undefined
}

export function createHandle(
  editor: Editor,
  emitter: Emitter,
  options: CreateEditorOptions,
  readOnlyRef: { current: boolean },
  gate: ChangeGate,
): EditorHandle {
  let destroyed = false
  const assertAlive = () => { if (destroyed) throw new Error('EditorHandle used after destroy()') }

  return {
    getMarkdown() {
      assertAlive()
      return editor.action(getMarkdown())
    },
    setMarkdown(markdown: string) {
      assertAlive()
      // 三语义（spec §6.1）：取消 pending 的 debounced onChange；不触发 onChange；flush 清空 undo 历史
      if (gate.timer) clearTimeout(gate.timer)
      gate.pending = undefined
      gate.silence = true
      try {
        editor.action(replaceAll(markdown, true))
      } finally {
        gate.silence = false
      }
    },
    getJSON() {
      assertAlive()
      return editor.action((ctx) => ctx.get(editorViewCtx).state.doc.toJSON()) as Record<string, unknown>
    },
    focus() {
      assertAlive()
      editor.action((ctx) => ctx.get(editorViewCtx).focus())
    },
    insert(markdown: string) {
      assertAlive()
      editor.action(insert(markdown))
    },
    execCommand(name: string, args?: unknown) {
      assertAlive()
      dispatchCommand(editor, name, args, options.onError)
    },
    setReadOnly(readOnly: boolean) {
      assertAlive()
      readOnlyRef.current = readOnly
    },
    // on 有意不做 assertAlive：destroy 后允许安全退订；destroy 后新订阅永远不会触发（emitter 已 clear）
    on<E extends EditorEvent>(event: E, cb: EditorEventMap[E]) {
      return emitter.on(event, cb)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      if (gate.timer) clearTimeout(gate.timer)
      emitter.clear()
      editor.destroy()
    },
  }
}
