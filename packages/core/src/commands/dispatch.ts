// commands/dispatch.ts
import type { Editor } from '@milkdown/core'
import { callCommand } from '@milkdown/utils'
import { redoCommand, undoCommand } from '@milkdown/plugin-history'
import type { EditorError } from '../types'

type Dispatcher = (editor: Editor, args?: unknown) => void

const table: Record<string, Dispatcher> = {
  undo: (e) => e.action(callCommand(undoCommand.key)),
  redo: (e) => e.action(callCommand(redoCommand.key)),
}

export function dispatchCommand(
  editor: Editor,
  name: string,
  args?: unknown,
  onError?: (error: EditorError) => void,
): void {
  const fn = table[name]
  if (!fn) {
    onError?.({ source: 'command', cause: new Error(`Unknown command: ${name}`) })
    return
  }
  fn(editor, args)
}
