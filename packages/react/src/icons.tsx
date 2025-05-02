// icons.tsx — 内联 SVG 图标（§5.2，推翻前序 spec §6.4 的字形占位决策）
import type { ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const icons: Record<string, ReactNode> = {
  undo: <Svg><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>,
  redo: <Svg><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></Svg>,
  heading: <Svg><path d="M6 4v16" /><path d="M18 4v16" /><path d="M6 12h12" /></Svg>,
  bold: <Svg><path d="M6 4h8a4 4 0 0 1 0 8H6z" /><path d="M6 12h9a4 4 0 0 1 0 8H6z" /></Svg>,
  italic: <Svg><path d="M19 4h-9" /><path d="M14 20H5" /><path d="m15 4-6 16" /></Svg>,
  strikethrough: <Svg><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><path d="M4 12h16" /></Svg>,
  code: <Svg><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></Svg>,
  link: <Svg><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>,
  image: <Svg><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></Svg>,
  table: <Svg><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>,
  quote: <Svg><path d="M17 6H3" /><path d="M21 12H8" /><path d="M21 18H8" /><path d="M3 12v6" /></Svg>,
  'code-block': <Svg><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m10 10-2 2 2 2" /><path d="m14 10 2 2-2 2" /></Svg>,
  math: <Svg><path d="M18 7V4H6l6 8-6 8h12v-3" /></Svg>,
  mermaid: <Svg><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></Svg>,
  'list-bullet': <Svg><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /></Svg>,
  'list-ordered': <Svg><path d="M10 6h11" /><path d="M10 12h11" /><path d="M10 18h11" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Svg>,
  'list-check': <Svg><path d="m3 7 2 2 4-4" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></Svg>,
}

/** 默认 items（前序 spec §6.2，保持不动） */
export const DEFAULT_ITEMS: string[] = [
  'undo', 'redo', '|',
  'heading', 'bold', 'italic', 'strike', 'code', '|',
  'link', 'image', 'table', 'quote', 'codeBlock', 'math', 'mermaid', '|',
  'bulletList', 'orderedList', 'taskList',
]
