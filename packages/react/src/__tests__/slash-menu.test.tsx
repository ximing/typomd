import { describe, expect, test } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderMdEditor } from './helpers'
import { slashQueryFromDiff } from '../slash-query'

// jsdom 不实现 Range.prototype.getClientRects/getBoundingClientRect，
// 而 ProseMirror 的 coordsAtPos 依赖它们（经 textRange → singleRect 调用）。
// polyfill 返回全 0 矩形——slashTrigger 坐标载荷在 jsdom 下为 0，不影响菜单打开/交互断言。
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

describe('slashQueryFromDiff 纯函数', () => {
  test('差分取查询词', () => {
    expect(slashQueryFromDiff('abc /', 'abc /he')).toBe('he')
  })
  test('带 serializer 尾部换行（getMarkdown 真实输出形态）也能取查询词——防回归', () => {
    // getMarkdown 输出以 '\n' 结尾；不 trimEnd 时差分含换行会误判 null（菜单键入即关）
    expect(slashQueryFromDiff('abc /\n', 'abc /he\n')).toBe('he')
  })
  test('查询词含空白 → 关闭信号 null', () => {
    expect(slashQueryFromDiff('abc /', 'abc /he llo')).toBeNull()
  })
  test("'/' 被删除 → null", () => {
    expect(slashQueryFromDiff('abc /\n', 'abc \n')).toBeNull()
  })
})

describe('Slash 菜单', () => {
  test('插入 / 触发 slashTrigger 后菜单出现，含 showIn=slash 的命令', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    const menu = await screen.findByTestId('slash-menu')
    expect(menu.querySelector('[data-command="heading"]')).not.toBeNull()
    expect(menu.querySelector('[data-command="undo"]')).toBeNull() // showIn 仅 toolbar
  })

  test('features.slash=false 时插入 / 不出现菜单（core 不发事件）', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '', features: { slash: false } })
    act(() => { handle.insert('/') })
    expect(screen.queryByTestId('slash-menu')).toBeNull()
  })

  test('Esc 关闭菜单', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    await screen.findByTestId('slash-menu')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('slash-menu')).toBeNull()
  })

  test('点击命令执行并清理 / 残留文本', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    const menu = await screen.findByTestId('slash-menu')
    fireEvent.click(menu.querySelector('[data-command="heading"]')!)
    expect(screen.queryByTestId('slash-menu')).toBeNull()
    expect(handle.getMarkdown()).not.toContain('/')
    expect(handle.getMarkdown()).toContain('#') // heading 已插入（空 level 标题的序列化形式以 core 实际输出为准）
  })

  test('未提供 onUploadImage 时 slash 菜单隐藏 image 项', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    const menu = await screen.findByTestId('slash-menu')
    expect(menu.querySelector('[data-command="image"]')).toBeNull()
  })

  test('条目为 div[role=option] 带稳定 id；打开期间 ProseMirror 带 aria-activedescendant（§5.5）', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    const menu = await screen.findByTestId('slash-menu')
    const opt = menu.querySelector('[data-command="heading"]')!
    expect(opt.tagName).toBe('DIV')
    expect(opt.getAttribute('role')).toBe('option')
    expect(opt.id).toBe('mdeditor-slash-opt-heading')
    const pm = document.querySelector('.ProseMirror')!
    expect(pm.getAttribute('aria-activedescendant')).toBe('mdeditor-slash-opt-heading')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(pm.getAttribute('aria-activedescendant')).toBeNull()
  })

  test('分组标题渲染（§5.5），aria-label=插入命令', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    const menu = await screen.findByTestId('slash-menu')
    expect(menu.getAttribute('aria-label')).toBe('插入命令')
    const groups = [...menu.querySelectorAll('.mdeditor-slash-group')].map((g) => g.textContent)
    expect(groups).toEqual(['基础', '列表', '媒体'])
  })

  test('ArrowDown 后 aria-activedescendant 跟随高亮项', async () => {
    const { handle } = await renderMdEditor({ defaultValue: '' })
    act(() => { handle.insert('/') })
    await screen.findByTestId('slash-menu')
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    const pm = document.querySelector('.ProseMirror')!
    expect(pm.getAttribute('aria-activedescendant')).toBe('mdeditor-slash-opt-bold')
  })
})
