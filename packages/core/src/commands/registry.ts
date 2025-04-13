// commands/registry.ts
import type { Ctx } from '@milkdown/ctx'
import { editorViewCtx } from '@milkdown/core'
import type { MarkType, NodeType } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { redoDepth, undoDepth } from '@milkdown/prose/history'
import {
  blockquoteSchema,
  bulletListSchema,
  codeBlockSchema,
  emphasisSchema,
  headingSchema,
  inlineCodeSchema,
  linkSchema,
  listItemSchema,
  orderedListSchema,
  strongSchema,
} from '@milkdown/preset-commonmark'
import { strikethroughSchema, tableSchema } from '@milkdown/preset-gfm'
import { mathBlockSchema } from '../presets/math/schema'
import { mermaidSchema } from '../presets/mermaid/schema'
import { internalHandles } from '../internal'
import type { EditorHandle } from '../types'

export type CommandPlacement = 'toolbar' | 'slash' | 'floating'

export interface CommandSpec {
  id: string
  icon: string
  label: string
  showIn: CommandPlacement[]
  isActive(handle: EditorHandle): boolean
  exec(handle: EditorHandle, args?: unknown): void
}

function withEditor<T>(handle: EditorHandle, fn: (ctx: Ctx) => T): T {
  const internal = internalHandles.get(handle)
  if (!internal) throw new Error('commandRegistry used with a foreign EditorHandle')
  return internal.editor.action((ctx) => fn(ctx))
}

function isMarkActive(state: EditorState, type: MarkType): boolean {
  const { from, $from, to, empty } = state.selection
  if (empty) return !!type.isInSet(state.storedMarks ?? $from.marks())
  return state.doc.rangeHasMark(from, to, type)
}

function isBlockActive(state: EditorState, type: NodeType, attrs: Record<string, unknown> = {}): boolean {
  const { $from } = state.selection
  for (let d = $from.depth; d >= 0; d--) {
    const n = $from.node(d)
    if (n.type === type) return Object.entries(attrs).every(([k, v]) => n.attrs[k] === v)
  }
  return false
}

const ALL: CommandPlacement[] = ['toolbar', 'slash', 'floating']
const TOOLBAR_ONLY: CommandPlacement[] = ['toolbar']

const entries: CommandSpec[] = [
  {
    id: 'undo', icon: 'undo', label: '撤销', showIn: TOOLBAR_ONLY,
    isActive: (h) => withEditor(h, (ctx) => undoDepth(ctx.get(editorViewCtx).state) > 0),
    exec: (h) => h.execCommand('undo'),
  },
  {
    id: 'redo', icon: 'redo', label: '重做', showIn: TOOLBAR_ONLY,
    isActive: (h) => withEditor(h, (ctx) => redoDepth(ctx.get(editorViewCtx).state) > 0),
    exec: (h) => h.execCommand('redo'),
  },
  {
    id: 'heading', icon: 'heading', label: '标题', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, headingSchema.type(ctx))),
    exec: (h, args) => h.execCommand('heading', args),
  },
  {
    id: 'bold', icon: 'bold', label: '加粗', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isMarkActive(ctx.get(editorViewCtx).state, strongSchema.type(ctx))),
    exec: (h) => h.execCommand('bold'),
  },
  {
    id: 'italic', icon: 'italic', label: '斜体', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isMarkActive(ctx.get(editorViewCtx).state, emphasisSchema.type(ctx))),
    exec: (h) => h.execCommand('italic'),
  },
  {
    id: 'strike', icon: 'strikethrough', label: '删除线', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isMarkActive(ctx.get(editorViewCtx).state, strikethroughSchema.type(ctx))),
    exec: (h) => h.execCommand('strike'),
  },
  {
    id: 'code', icon: 'code', label: '行内代码', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isMarkActive(ctx.get(editorViewCtx).state, inlineCodeSchema.type(ctx))),
    exec: (h) => h.execCommand('code'),
  },
  {
    id: 'link', icon: 'link', label: '链接', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isMarkActive(ctx.get(editorViewCtx).state, linkSchema.type(ctx))),
    exec: (h, args) => h.execCommand('link', args),
  },
  {
    id: 'image', icon: 'image', label: '图片', showIn: ['toolbar', 'slash'],
    isActive: () => false,
    exec: (h, args) => h.execCommand('image', args),
  },
  {
    id: 'table', icon: 'table', label: '表格', showIn: ['toolbar', 'slash'],
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, tableSchema.type(ctx))),
    exec: (h) => h.execCommand('table'),
  },
  {
    id: 'quote', icon: 'quote', label: '引用', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, blockquoteSchema.type(ctx))),
    exec: (h) => h.execCommand('quote'),
  },
  {
    id: 'codeBlock', icon: 'code-block', label: '代码块', showIn: ['toolbar', 'slash'],
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, codeBlockSchema.type(ctx))),
    exec: (h) => h.execCommand('codeBlock'),
  },
  {
    id: 'math', icon: 'math', label: '公式', showIn: ['toolbar', 'slash'],
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, mathBlockSchema.type(ctx))),
    exec: (h) => h.execCommand('math'),
  },
  {
    id: 'mermaid', icon: 'mermaid', label: 'Mermaid 图', showIn: ['toolbar', 'slash'],
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, mermaidSchema.type(ctx))),
    exec: (h) => h.execCommand('mermaid'),
  },
  {
    id: 'bulletList', icon: 'list-bullet', label: '无序列表', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, bulletListSchema.type(ctx))),
    exec: (h) => h.execCommand('bulletList'),
  },
  {
    id: 'orderedList', icon: 'list-ordered', label: '有序列表', showIn: ALL,
    isActive: (h) => withEditor(h, (ctx) => isBlockActive(ctx.get(editorViewCtx).state, orderedListSchema.type(ctx))),
    exec: (h) => h.execCommand('orderedList'),
  },
  {
    id: 'taskList', icon: 'list-check', label: '任务列表', showIn: ALL,
    isActive: (h) =>
      withEditor(h, (ctx) => {
        const state = ctx.get(editorViewCtx).state
        return isBlockActive(state, listItemSchema.type(ctx)) &&
          state.selection.$from.node(-1).attrs.checked !== null // 最近的 listItem 祖先带 checked 即任务列表
      }),
    exec: (h) => h.execCommand('taskList'),
  },
]

export const commandRegistry: ReadonlyMap<string, CommandSpec> = new Map(entries.map((e) => [e.id, e]))
