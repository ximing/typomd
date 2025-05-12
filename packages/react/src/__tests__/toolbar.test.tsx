import { describe, expect, test, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderTypomd } from './helpers'

describe('顶部工具栏（§6.2）', () => {
  test('默认渲染全部内置命令按钮与分隔符', async () => {
    // 传 onUploadImage stub 使 image 入口可见，17 个按钮才全部渲染（spec §6.1 入口隐藏规则）
    const { root } = await renderTypomd({
      defaultValue: '# A',
      onUploadImage: async () => ({ src: 'https://a.com/x.png' }),
    })
    const toolbar = root.querySelector('.typomd-toolbar')!
    expect(toolbar).not.toBeNull()
    expect(toolbar.querySelectorAll('.typomd-toolbar-button').length).toBe(17)
    // NOTE: DEFAULT_ITEMS（P2-T2，匹配 spec §6.2）含 3 个 '|' 分隔符，非 4。
    expect(toolbar.querySelectorAll('.typomd-toolbar-separator').length).toBe(3)
  })

  test('visible: false 时完全不渲染', async () => {
    const { root } = await renderTypomd({ defaultValue: '# A', toolbar: { visible: false } })
    expect(root.querySelector('.typomd-toolbar')).toBeNull()
  })

  test('点击 bold 按钮对空文档执行命令不报错；isActive 经 data-active 反映', async () => {
    const { root, handle } = await renderTypomd({ defaultValue: 'hello' })
    const bold = root.querySelector('[data-command="bold"]') as HTMLButtonElement
    expect(bold.getAttribute('data-active')).toBeNull()
    fireEvent.click(bold) // 无选区时 toggle 不炸即可
    expect(handle.getMarkdown()).toBeDefined()
  })

  test('自定义渲染项收到 ctx 并可执行命令', async () => {
    const onCustom = vi.fn()
    const { root } = await renderTypomd({
      defaultValue: '# A',
      toolbar: {
        items: [
          (ctx) => (
            <button data-testid="custom" onClick={() => { onCustom(ctx.isActive('bold')); ctx.exec('undo') }}>
              自定义
            </button>
          ),
        ],
      },
    })
    fireEvent.click(screen.getByTestId('custom'))
    expect(onCustom).toHaveBeenCalledWith(false)
    expect(root.querySelectorAll('.typomd-toolbar-button').length).toBe(0) // 未包含内置项
  })

  test('未提供 onUploadImage 时 image 按钮隐藏（spec §6.1）', async () => {
    const { root } = await renderTypomd({ defaultValue: '# A' })
    expect(root.querySelector('[data-command="image"]')).toBeNull()
  })

  test('提供 onUploadImage 时 image 按钮显示', async () => {
    const { root } = await renderTypomd({
      defaultValue: '# A',
      onUploadImage: async () => ({ src: 'https://a.com/x.png' }),
    })
    expect(root.querySelector('[data-command="image"]')).not.toBeNull()
  })

  test('未知命令 id 跳过并 warn，不渲染按钮', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { root } = await renderTypomd({ defaultValue: '# A', toolbar: { items: ['bold', 'nope'] } })
    expect(root.querySelector('[data-command="bold"]')).not.toBeNull()
    expect(root.querySelector('[data-command="nope"]')).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  test('aria（§5.3）：容器 role=toolbar；按钮 aria-label + aria-pressed，无 title，带 data-tooltip', async () => {
    const { root } = await renderTypomd({ defaultValue: '# A' })
    const bar = root.querySelector('.typomd-toolbar')!
    expect(bar.getAttribute('role')).toBe('toolbar')
    expect(bar.getAttribute('aria-label')).toBe('格式工具栏')
    const bold = root.querySelector('[data-command="bold"]')!
    expect(bold.getAttribute('aria-label')).toBe('加粗')
    expect(bold.getAttribute('aria-pressed')).toBe('false')
    expect(bold.getAttribute('title')).toBeNull()
    expect(bold.getAttribute('data-tooltip')).toContain('加粗')
    expect(bold.getAttribute('data-active')).toBeNull() // 未激活
  })

  test('roving tabindex（§5.3）：方向键移动焦点，Esc 回焦编辑器', async () => {
    const { root, handle } = await renderTypomd({ defaultValue: '# A' })
    const bar = root.querySelector('.typomd-toolbar')!
    const buttons = [...bar.querySelectorAll<HTMLButtonElement>('.typomd-toolbar-button')]
    expect(buttons[0]!.tabIndex).toBe(0)
    expect(buttons[1]!.tabIndex).toBe(-1)
    const focusSpy = vi.spyOn(handle, 'focus')
    buttons[0]!.focus()
    fireEvent.keyDown(bar, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1])
    expect(buttons[1]!.tabIndex).toBe(0)
    expect(buttons[0]!.tabIndex).toBe(-1)
    fireEvent.keyDown(bar, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[0])
    fireEvent.keyDown(bar, { key: 'End' })
    expect(document.activeElement).toBe(buttons[buttons.length - 1])
    fireEvent.keyDown(bar, { key: 'Escape' })
    expect(focusSpy).toHaveBeenCalled()
    focusSpy.mockRestore()
  })

  test('点击按钮后焦点回编辑器（§5.3）', async () => {
    const { root, handle } = await renderTypomd({ defaultValue: 'hello' })
    const focusSpy = vi.spyOn(handle, 'focus')
    fireEvent.click(root.querySelector('[data-command="bold"]')!)
    expect(focusSpy).toHaveBeenCalled()
    focusSpy.mockRestore()
  })
})
