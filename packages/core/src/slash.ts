// slash.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { SlashTriggerPayload } from './types'

/**
 * 输入 '/' 时发出带坐标的 slashTrigger（spec §5.2）。
 * 触发条件：光标为折叠选区、刚输入的字符是 '/'、且位于块首或前一个字符是空白。
 */
export function createSlashPlugin(onTrigger: (payload: SlashTriggerPayload) => void): MilkdownPlugin {
  return $prose(
    () =>
      new Plugin({
        key: new PluginKey('mdeditor-slash-trigger'),
        view: (view) => ({
          update: (view, prevState) => {
            if (view.state.doc.eq(prevState.doc)) return
            const { $from, empty } = view.state.selection
            if (!empty || !$from.parent.isTextblock) return
            if ($from.parentOffset < 1) return
            const lastChar = $from.parent.textBetween($from.parentOffset - 1, $from.parentOffset, undefined, '�')
            if (lastChar !== '/') return
            const atBlockStart = $from.parentOffset === 1
            const charBefore = atBlockStart
              ? ''
              : $from.parent.textBetween($from.parentOffset - 2, $from.parentOffset - 1, undefined, '�')
            if (!atBlockStart && !/\s/.test(charBefore)) return
            const coords = view.coordsAtPos($from.pos)
            onTrigger({ top: coords.bottom, left: coords.left, pos: $from.pos })
          },
          destroy: () => {},
        }),
      }),
  )
}
