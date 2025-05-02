// command-meta.ts — 快捷键提示与 slash 分组映射（§5.3/§5.5：集中于一处维护）
// SHORTCUTS 仅收录经 node_modules 实际绑定核实的项（Milkdown preset 默认 keymap）；
// CommandSpec 无 shortcut 字段且 core 冻结，接受与 core keymap 的漂移风险（§5.3）。
export const SHORTCUTS: Record<string, string> = {
  undo: '⌘Z',
  redo: '⌘⇧Z',
  bold: '⌘B',
  italic: '⌘I',
  code: '⌘E',
  strike: '⌘⌥X',
  quote: '⌘⇧B',
  codeBlock: '⌘⌥C',
  bulletList: '⌘⌥8',
  orderedList: '⌘⌥7',
}

/** slash 菜单分组：命令 id → 分组名（§5.5）。覆盖全部 showIn 含 slash 的命令。 */
export const SLASH_GROUPS: Record<string, string> = {
  heading: '基础',
  bold: '基础',
  italic: '基础',
  strike: '基础',
  code: '基础',
  link: '基础',
  quote: '基础',
  bulletList: '列表',
  orderedList: '列表',
  taskList: '列表',
  table: '媒体',
  image: '媒体',
  codeBlock: '媒体',
  math: '媒体',
  mermaid: '媒体',
}

/** 分组展示顺序；未在 SLASH_GROUPS 中的命令落入末尾默认分组（§5.5） */
export const SLASH_GROUP_ORDER = ['基础', '列表', '媒体', '其他']
