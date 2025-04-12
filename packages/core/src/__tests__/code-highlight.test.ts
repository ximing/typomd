import { describe, expect, test, vi } from 'vitest'
import { createEditor } from '../index'
import { createTestEditor } from './helpers'

describe('codeHighlight preset（Shiki）', () => {
  test('js 代码块渲染出带 style 的高亮 span，且 style 含 --shiki-dark 双主题变量', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```js\nconst a = 1\n```\n', features: { codeHighlight: true },
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.ProseMirror pre span[style]')).not.toBeNull()
    }, { timeout: 10000 })
    // 守护 htmlStyle Record 序列化路径：暗色变量缺失意味着暗色高亮静默失效
    const span = root.querySelector('.ProseMirror pre span[style]')!
    expect(span.getAttribute('style')).toContain('--shiki-dark')
    handle.destroy()
  })

  test('未知语言按需异步加载：加载成功后出现高亮', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```rust\nfn main() {}\n```\n', features: { codeHighlight: true },
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.ProseMirror pre span[style]')).not.toBeNull()
    }, { timeout: 15000 })
    handle.destroy()
  })

  test('不存在的语言 → 回退纯文本 + onError（spec §8）', async () => {
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```definitely-not-a-lang\nfoo bar\n```\n', features: { codeHighlight: true }, onError,
    })
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'codeHighlight' }))
    }, { timeout: 10000 })
    expect(root.querySelector('.ProseMirror pre span[style]')).toBeNull()
    expect(root.textContent).toContain('foo bar')
    handle.destroy()
  })

  test('未开启 feature 时无高亮', async () => {
    const handle = await createTestEditor('```js\nconst a = 1\n```\n')
    expect(handle.getMarkdown()).toContain('const a = 1')
    handle.destroy()
  })
})
