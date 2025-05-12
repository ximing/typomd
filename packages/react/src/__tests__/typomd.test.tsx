import { describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
import '@typomd/theme/default.css' // jsdom 下仅验证 import 不炸；样式断言在 e2e
import { renderTypomd } from './helpers'

describe('<Typomd>', () => {
  test('挂载后 ref 提供 EditorHandle，defaultValue 生效', async () => {
    const { handle } = await renderTypomd({ defaultValue: '# Hello' })
    expect(handle.getMarkdown().trimEnd()).toBe('# Hello')
  })

  test('onChange 回调转发 core 双格式载荷', async () => {
    const onChange = vi.fn()
    const { handle } = await renderTypomd({ defaultValue: '# A', onChange })
    handle.insert('world')
    expect(onChange).toHaveBeenCalled()
    const [md, json] = onChange.mock.lastCall!
    expect(md).toContain('world')
    expect(json).toMatchObject({ type: 'doc' })
  })

  test('readOnly prop 变化同步 handle.setReadOnly（spec §6.1）', async () => {
    const { handle, rerender } = await renderTypomd({ defaultValue: '# A', readOnly: true })
    const spy = vi.spyOn(handle, 'setReadOnly')
    const { Typomd } = await import('../Typomd')
    rerender(
      <Typomd ref={() => { handle }} defaultValue="# A" readOnly={false} onChangeDebounce={0} />,
    )
    expect(spy).toHaveBeenCalledWith(false)
  })

  test('placeholder 挂在 .ProseMirror 元素上（::before attr() 只能读自身属性）', async () => {
    await renderTypomd({ placeholder: '输入 / 唤起命令...' })
    expect(
      screen.getByTestId('typomd').querySelector('.ProseMirror')!.getAttribute('data-placeholder'),
    ).toBe('输入 / 唤起命令...')
  })

  test('卸载时 destroy（再访问 handle 抛错）', async () => {
    const { handle, unmount } = await renderTypomd({ defaultValue: '# A' })
    unmount()
    expect(() => handle.getMarkdown()).toThrow('destroy')
  })
})
