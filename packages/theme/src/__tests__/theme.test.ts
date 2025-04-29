import { describe, expect, test } from 'vitest'
import { buildAutoCss, buildCss } from '../../scripts/build-css.mjs'
import { tokens } from '../index'
import { contrast } from './contrast'

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
    expect(tokens.dark['color-bg']).toBe('#191919')
  })

  test('v2 令牌集：shared 扩展键与新语义颜色键存在', () => {
    for (const k of ['space-0_5', 'space-1_5', 'space-5', 'space-8', 'radius-sm', 'radius-md', 'radius-lg', 'radius-full',
      'font-size-ui', 'font-size-ui-sm', 'duration-fast', 'duration-base', 'ease-standard', 'ease-out',
      'z-sticky', 'z-floating', 'z-slash', 'z-tooltip']) {
      expect(tokens.shared).toHaveProperty(k)
    }
    for (const k of ['color-bg-secondary', 'color-bg-elevated', 'color-text-secondary', 'color-border-strong',
      'color-hover', 'color-active', 'color-accent-contrast', 'color-accent-subtle', 'color-focus-ring',
      'color-danger', 'color-code-bg', 'shadow-popover']) {
      expect(tokens.light).toHaveProperty(k)
      expect(tokens.dark).toHaveProperty(k)
    }
    // 字体栈保持现值（spec 未授权改字栈）
    expect(tokens.shared['font-text']).toContain('PingFang SC')
    expect(tokens.shared['font-mono']).toContain('SF Mono')
  })

  test('构建层别名：旧令牌以 var() 引用生成（§12 阶段 1，过渡期）', () => {
    const css = buildCss(tokens)
    expect(css).toContain('--mdeditor-radius: var(--mdeditor-radius-md);')
    expect(css).toContain('--mdeditor-color-error: var(--mdeditor-color-danger);')
    expect(css).toContain('--mdeditor-color-quote-border: var(--mdeditor-color-text);')
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

  test('WCAG 对比度（§6）：正文/次级 ≥ 4.5，focus-ring ≥ 3（亮/暗）', () => {
    for (const theme of [tokens.light, tokens.dark] as Record<string, string>[]) {
      const bg = theme['color-bg']!
      expect(contrast(theme['color-text']!, bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme['color-text-secondary']!, bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme['color-focus-ring']!, bg)).toBeGreaterThanOrEqual(3)
    }
    // text-muted 与 hairline 边框为装饰性/非必要信息，不断言（§6）
  })

  test('default.css 拼接 content.css 与 content-dark.css；auto.css 含媒体查询与机械变换', () => {
    const css = buildCss(tokens)
    expect(css).toContain('.mdeditor .ProseMirror {')
    expect(css).toContain('.mdeditor-dark .ProseMirror pre span')
    const auto = buildAutoCss(tokens)
    expect(auto).toContain('@media (prefers-color-scheme: dark)')
    // 类限定规则机械变换：.mdeditor-dark X → @media 内 .mdeditor X（§3.2）
    expect(auto).toContain('.mdeditor .ProseMirror pre span')
    // 健壮断言：不存在任何 .mdeditor-dark 选择器行（注释里出现该字符串不算）
    expect(auto).not.toMatch(/^\s*\.mdeditor-dark /m)
  })

  test('buildCss/buildAutoCss 输出快照（§11：含 content.css 拼接）', () => {
    expect(buildCss(tokens)).toMatchSnapshot()
    expect(buildAutoCss(tokens)).toMatchSnapshot()
  })
})
