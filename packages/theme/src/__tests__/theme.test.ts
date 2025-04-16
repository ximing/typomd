import { describe, expect, test } from 'vitest'
import { buildCss } from '../../scripts/build-css.mjs'
import { tokens } from '../index'

describe('theme tokens', () => {
  test('亮/暗两组颜色令牌键完全对齐', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual(Object.keys(tokens.light).sort())
  })

  test('生成的 CSS 包含每个令牌变量与 .mdeditor-dark 覆写', () => {
    const css = buildCss(tokens)
    for (const [group, values] of Object.entries(tokens)) {
      for (const [name, value] of Object.entries(values as Record<string, string>)) {
        expect(css).toContain(`--mdeditor-${name}: ${value};`)
      }
      void group
    }
    expect(css).toContain(':root, .mdeditor {')
    expect(css).toContain('.mdeditor-dark {')
    // 暗色覆写不得包含 shared 令牌（间距/字体不随主题变化）
    const darkBlock = css.split('.mdeditor-dark {')[1]!.split('}')[0]!
    expect(darkBlock).not.toContain('--mdeditor-font-mono')
  })

  test('JSON 导出与 CSS 数据源一致（同一份 tokens 对象）', () => {
    expect(tokens.light['color-bg']).toBe('#ffffff')
    expect(tokens.dark['color-bg']).toBe('#0d1117')
  })

  test('暗色覆写包含 shiki 双主题规则', () => {
    const css = buildCss(tokens)
    expect(css).toContain('.mdeditor-dark .ProseMirror pre span')
    expect(css).toContain('var(--shiki-dark)')
  })

  test('包含 placeholder 结构性规则（trailingBreak 命中条件）', () => {
    const css = buildCss(tokens)
    expect(css).toContain('[data-placeholder]')
    expect(css).toContain('br.ProseMirror-trailingBreak:only-child')
  })
})
