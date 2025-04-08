import { describe, expect, test, vi } from 'vitest'
import { createEditor } from '../index'
import { createTestEditor } from './helpers'

// jsdom 不实现 Range.prototype.getClientRects/getBoundingClientRect，
// 而 ProseMirror 的 coordsAtPos 依赖它们（经 textRange → singleRect 调用）。
// polyfill 返回全 0 矩形——即 brief 所述「jsdom 下 coordsAtPos 返回全 0 矩形」的预期行为。
const zeroRect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 } as unknown as DOMRect
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = function (this: Range): DOMRectList {
    return [zeroRect] as unknown as DOMRectList
  }
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function (this: Range): DOMRect {
    return zeroRect
  }
}

describe('slashTrigger 事件', () => {
  test('默认开启：insert 一个 / 触发事件且带坐标载荷', async () => {
    const handle = await createTestEditor('')
    const onSlash = vi.fn()
    handle.on('slashTrigger', onSlash)
    handle.insert('/')
    expect(onSlash).toHaveBeenCalledTimes(1)
    expect(onSlash.mock.lastCall![0]).toMatchObject({ top: expect.any(Number), left: expect.any(Number), pos: expect.any(Number) })
    handle.destroy()
  })

  test('features.slash=false 时不发事件（spec §5.2）', async () => {
    const handle = await createTestEditor('', { slash: false })
    const onSlash = vi.fn()
    handle.on('slashTrigger', onSlash)
    handle.insert('/')
    expect(onSlash).not.toHaveBeenCalled()
    handle.destroy()
  })

  test('普通文本输入不触发', async () => {
    const handle = await createTestEditor('')
    const onSlash = vi.fn()
    handle.on('slashTrigger', onSlash)
    handle.insert('hello')
    expect(onSlash).not.toHaveBeenCalled()
    handle.destroy()
  })
})

describe('on(event) 退订', () => {
  test('返回的函数退订后不再收到事件', async () => {
    const handle = await createTestEditor('# A')
    const onSel = vi.fn()
    const off = handle.on('selectionChange', onSel)
    off()
    handle.insert('x')
    expect(onSel).not.toHaveBeenCalled()
    handle.destroy()
  })
})
