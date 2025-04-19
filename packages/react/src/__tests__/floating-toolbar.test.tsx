import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FloatingToolbar } from '../FloatingToolbar'
import { renderMdEditor } from './helpers'

describe('悬浮工具栏', () => {
  // 直接 render(<FloatingToolbar>) 的用例必须关掉 MdEditor 自带的悬浮条，
  // 否则页面存在两个同 testid 实例，queryBy* 会因多匹配抛错
  test('空选区不渲染', async () => {
    const { handle } = await renderMdEditor({ defaultValue: 'hello', features: { floatingToolbar: false } })
    const { container } = render(<FloatingToolbar handle={handle} />)
    expect(container.firstChild).toBeNull()
  })

  test('features.floatingToolbar=false 时 MdEditor 不挂载该组件', async () => {
    await renderMdEditor({ defaultValue: 'hello', features: { floatingToolbar: false } })
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
  })
})
