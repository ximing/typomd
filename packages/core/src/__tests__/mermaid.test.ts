import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (_id: string, code: string) => {
      if (code.includes('INVALID')) throw new Error('parse error')
      return { svg: `<svg data-code="${code.trim()}"></svg>` }
    }),
  },
}))

import { createEditor } from '../index'
import { createTestEditor } from './helpers'

beforeEach(() => vi.clearAllMocks())

describe('mermaid preset', () => {
  test('mermaid 围栏 roundtrip 字符串恒等', async () => {
    const md = '```mermaid\ngraph TD\n    A-->B\n```\n'
    const handle = await createTestEditor(md, { mermaid: true })
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })

  test('启用后渲染为 SVG（nodeView 生效）', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    A-->B\n```\n', features: { mermaid: true },
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.typomd-mermaid svg')).not.toBeNull()
    })
    handle.destroy()
  })

  test('渲染失败 → 源码显示 + 错误角标 + onError（spec §8）', async () => {
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\nINVALID\n```\n', features: { mermaid: true }, onError,
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.typomd-mermaid.typomd-node-error')).not.toBeNull()
    })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'mermaid:render' }))
    handle.destroy()
  })

  test('普通 js 代码块不受 mermaid 节点影响', async () => {
    const md = '```js\nconst a = 1\n```\n'
    const handle = await createTestEditor(md, { mermaid: true })
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })
})
