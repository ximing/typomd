// commands/dispatch.ts
import type { Editor } from '@milkdown/core'
import { callCommand } from '@milkdown/utils'
import { redoCommand, undoCommand } from '@milkdown/plugin-history'
import {
  insertImageCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from '@milkdown/preset-commonmark'
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { insertMathBlockCommand } from '../presets/math/index'
import { insertMermaidCommand } from '../presets/mermaid/index'
import { setCodeBlockCommand, setHeadingCommand, turnIntoTaskListCommand } from './custom'
import type { EditorError } from '../types'

type Dispatcher = (editor: Editor, args?: unknown) => void

const table: Record<string, Dispatcher> = {
  undo: (e) => e.action(callCommand(undoCommand.key)),
  redo: (e) => e.action(callCommand(redoCommand.key)),
  heading: (e, args) => e.action(callCommand(setHeadingCommand.key, (args as { level?: number } | undefined)?.level ?? 1)),
  bold: (e) => e.action(callCommand(toggleStrongCommand.key)),
  italic: (e) => e.action(callCommand(toggleEmphasisCommand.key)),
  strike: (e) => e.action(callCommand(toggleStrikethroughCommand.key)),
  code: (e) => e.action(callCommand(toggleInlineCodeCommand.key)),
  link: (e, args) => e.action(callCommand(toggleLinkCommand.key, args as { href: string } | undefined)),
  image: (e, args) => e.action(callCommand(insertImageCommand.key, args as { src?: string; alt?: string; title?: string })),
  table: (e) => e.action(callCommand(insertTableCommand.key)),
  quote: (e) => e.action(callCommand(wrapInBlockquoteCommand.key)),
  codeBlock: (e) => e.action(callCommand(setCodeBlockCommand.key)),
  math: (e) => e.action(callCommand(insertMathBlockCommand.key)),
  mermaid: (e) => e.action(callCommand(insertMermaidCommand.key)),
  bulletList: (e) => e.action(callCommand(wrapInBulletListCommand.key)),
  orderedList: (e) => e.action(callCommand(wrapInOrderedListCommand.key)),
  taskList: (e) => e.action(callCommand(turnIntoTaskListCommand.key)),
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
  try {
    fn(editor, args)
  } catch (cause) {
    // 例如 math/mermaid feature 未开启时对应命令未注册
    onError?.({ source: 'command', cause })
  }
}
