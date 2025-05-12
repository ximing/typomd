import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FloatingToolbar } from '../FloatingToolbar'
import { renderTypomd } from './helpers'

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

describe('悬浮工具栏', () => {
  // 直接 render(<FloatingToolbar>) 的用例必须关掉 Typomd 自带的悬浮条，
  // 否则页面存在两个同 testid 实例，queryBy* 会因多匹配抛错
  test('空选区不渲染', async () => {
    const { handle } = await renderTypomd({ defaultValue: 'hello', features: { floatingToolbar: false } })
    const { container } = render(<FloatingToolbar handle={handle} />)
    expect(container.firstChild).toBeNull()
  })

  test('features.floatingToolbar=false 时 Typomd 不挂载该组件', async () => {
    await renderTypomd({ defaultValue: 'hello', features: { floatingToolbar: false } })
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
  })

  test('aria：容器 role=toolbar，按钮 aria-label/aria-pressed 且无 title', async () => {
    const { root } = await renderTypomd({ defaultValue: 'hello world' })
    const pm = root.querySelector('.ProseMirror') as HTMLElement
    // 构造非空 DOM 选区并通知 PM：jsdom 不自动派发 selectionchange，
    // PM 监听 document 的 selectionchange 读回 DOM 选区 → 更新 PM selection →
    // core 的 selectionUpdated 监听器发 selectionChange → FloatingToolbar 取选区矩形渲染
    pm.focus()
    const textNode = pm.querySelector('p')!.firstChild!
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)
    fireEvent(document, new Event('selectionchange'))
    const bar = await screen.findByTestId('floating-toolbar')
    expect(bar.getAttribute('role')).toBe('toolbar')
    expect(bar.getAttribute('aria-label')).toBe('悬浮格式工具栏')
    const bold = bar.querySelector('[data-command="bold"]')!
    expect(bold.getAttribute('aria-label')).toBe('加粗')
    expect(bold.getAttribute('aria-pressed')).toBe('false')
    expect(bold.getAttribute('title')).toBeNull()
  })
})
