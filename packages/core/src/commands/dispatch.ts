// commands/dispatch.ts
import type { Editor } from '@milkdown/core'
import { callCommand } from '@milkdown/utils'
import { redoCommand, undoCommand } from '@milkdown/plugin-history'
import { insertImageCommand } from '@milkdown/preset-commonmark'
import type { EditorError } from '../types'

type Dispatcher = (editor: Editor, args?: unknown) => void

const table: Record<string, Dispatcher> = {
  undo: (e) => e.action(callCommand(undoCommand.key)),
  redo: (e) => e.action(callCommand(redoCommand.key)),
  // Task 10：复用 commonmark 内置 insertImageCommand（payload { src?, alt?, title? }）。
  // Task 12 全表重写时此行会被吞并，目前保证 image 命令独立可测。
  image: (e, args) => e.action(callCommand(insertImageCommand.key, args as { src?: string; alt?: string; title?: string })),
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
