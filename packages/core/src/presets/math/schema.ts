// presets/math/schema.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import { $nodeSchema, $remark } from '@milkdown/utils'
import remarkMath from 'remark-math'

// 注解为 MilkdownPlugin[]：$remark 返回元组 [optionsCtx, plugin]，两者皆为 MilkdownPlugin；
// 显式注解避免推断类型引用 transitive 依赖 mdast-util-math（TS2742 不可移植）。
export const remarkMathPlugin: MilkdownPlugin[] = $remark('mdeditorRemarkMath', () => remarkMath)

/** 行内公式：atom，源码存 attrs.value，编辑在 nodeView 内完成 */
export const mathInlineSchema = $nodeSchema('math_inline', () => ({
  inline: true,
  group: 'inline',
  atom: true,
  attrs: { value: { default: '', validate: 'string' } },
  parseDOM: [{ tag: 'span[data-math-inline]' }],
  toDOM: (node) => ['span', { 'data-math-inline': '', 'data-value': node.attrs.value }, node.attrs.value as string],
  parseMarkdown: {
    match: (node) => node.type === 'inlineMath',
    runner: (state, node, type) => {
      state.addNode(type, { value: (node as unknown as { value: string }).value })
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'math_inline',
    runner: (state, node) => {
      state.addNode('inlineMath', undefined, node.attrs.value as string)
    },
  },
}))

/** 块级公式 */
export const mathBlockSchema = $nodeSchema('math_block', () => ({
  group: 'block',
  atom: true,
  attrs: { value: { default: '', validate: 'string' } },
  parseDOM: [{ tag: 'div[data-math-block]' }],
  toDOM: (node) => ['div', { 'data-math-block': '', 'data-value': node.attrs.value }, node.attrs.value as string],
  parseMarkdown: {
    match: (node) => node.type === 'math',
    runner: (state, node, type) => {
      state.addNode(type, { value: (node as unknown as { value: string }).value })
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'math_block',
    runner: (state, node) => {
      state.addNode('math', undefined, node.attrs.value as string)
    },
  },
}))
