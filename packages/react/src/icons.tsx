// icons.tsx
import type { ReactNode } from 'react'

/** spec §6.4：不引入图标库；用文字/符号字形占位，使用方可 CSS 覆写 */
export const icons: Record<string, ReactNode> = {
  undo: '↩',
  redo: '↪',
  heading: 'H',
  bold: 'B',
  italic: 'I',
  strikethrough: 'S',
  code: '<>',
  link: '🔗',
  image: '🖼',
  table: '⊞',
  quote: '❝',
  'code-block': '{ }',
  math: '∑',
  mermaid: '◈',
  'list-bullet': '•',
  'list-ordered': '1.',
  'list-check': '☑',
}

/** §6.2 默认 items（与 spec 示例一致，去掉自定义渲染项） */
export const DEFAULT_ITEMS: string[] = [
  'undo', 'redo', '|',
  'heading', 'bold', 'italic', 'strike', 'code', '|',
  'link', 'image', 'table', 'quote', 'codeBlock', 'math', 'mermaid', '|',
  'bulletList', 'orderedList', 'taskList',
]
