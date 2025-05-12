import { describe, expect, test, vi } from 'vitest'
import { createEditor } from '../index'
import { createTestEditor } from './helpers'

describe('math preset', () => {
  test('math.md canonical fixture 字符串恒等（已被 roundtrip.test.ts 覆盖，此处验证启用 features.math 后依然恒等）', async () => {
    const md = 'inline $a^2$ math.\n\n$$\nx = 1\n$$\n'
    const handle = await createTestEditor(md, { math: true })
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })

  test('KaTeX 渲染失败 → 源码显示 + 错误角标 + onError 上报（spec §8）', async () => {
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '$\\frac{$', features: { math: true }, onError, onChangeDebounce: 0,
    })
    await new Promise((r) => setTimeout(r, 0))
    const errorNode = root.querySelector('.typomd-math.typomd-node-error')
    expect(errorNode).not.toBeNull()
    expect(errorNode!.textContent).toContain('\\frac{')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'math:render' }))
    handle.destroy()
  })

  test('features.math 未开启时 $ 按普通文本处理', async () => {
    const handle = await createTestEditor('a $b$ c\n')
    expect(handle.getMarkdown()).toContain('$b$')
    handle.destroy()
  })
})
