// presets/base.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { listener } from '@milkdown/plugin-listener'
import { setCodeBlockCommand, setHeadingCommand, turnIntoTaskListCommand } from '../commands/custom'

/** schema 基座：CommonMark + GFM + undo/redo + 事件桥 + 自建命令。 */
export function basePlugins(): MilkdownPlugin[] {
  return [commonmark, gfm, history, listener, setHeadingCommand, setCodeBlockCommand, turnIntoTaskListCommand].flat() as MilkdownPlugin[]
}
