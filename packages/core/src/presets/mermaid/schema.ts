// presets/mermaid/schema.ts
import { $nodeSchema, $remark } from '@milkdown/utils'
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'

interface MdastCode extends Node {
  type: string
  lang?: string | null
  value: string
}

/**
 * 把 lang=mermaid 的 code 节点在 mdast 层改写为独立类型 'mermaid'。
 * 为什么不能用 schema priority：已核实 @milkdown/transformer@7.22.1 的 parser 按注册顺序
 * 取首个命中的 match，从不读取 priority；code_block 先注册且匹配所有 code 节点，
 * priority 方案下 mermaid 节点永远不会被 parse 出来（官方 deprecated plugin-diagram@7.7.0
 * 正是用本改写方案）。
 */
export const remarkMermaidPlugin = $remark('mdeditorRemarkMermaid', () => {
  return function remarkMermaid() {
    return (tree: Node) => {
      visit(tree, 'code', (node) => {
        const n = node as MdastCode
        if (n.lang === 'mermaid') n.type = 'mermaid'
      })
    }
  }
})

/** mermaid 代码块特化节点：markdown 形式即 ```mermaid 围栏 */
export const mermaidSchema = $nodeSchema('mermaid', () => ({
  group: 'block',
  atom: true,
  attrs: { value: { default: '', validate: 'string' } },
  parseDOM: [{ tag: 'div[data-mermaid]' }],
  toDOM: (node) => ['div', { 'data-mermaid': '', 'data-value': node.attrs.value }, node.attrs.value as string],
  parseMarkdown: {
    match: (node) => node.type === 'mermaid',
    runner: (state, node, type) => {
      state.addNode(type, { value: (node as unknown as { value: string }).value })
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'mermaid',
    runner: (state, node) => {
      // 已核实正确：序列化回 code 节点并带 lang=mermaid
      state.addNode('code', undefined, node.attrs.value as string, { lang: 'mermaid' })
    },
  },
}))
