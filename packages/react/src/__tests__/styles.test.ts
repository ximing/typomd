import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const stylesDir = join(__dirname, '..', 'styles')

describe('styles 拆分（§5.1）', () => {
  test('四个分文件存在', () => {
    for (const f of ['base.css', 'toolbar.css', 'floating.css', 'slash.css']) {
      expect(() => readFileSync(join(stylesDir, f), 'utf8')).not.toThrow()
    }
  })

  test('base.css 含 box-shadow 焦点环与 reduced-motion 兜底', () => {
    const base = readFileSync(join(stylesDir, 'base.css'), 'utf8')
    expect(base).toContain(':focus-visible')
    expect(base).toContain('box-shadow')
    expect(base).toContain('--typomd-color-focus-ring')
    expect(base).toContain('prefers-reduced-motion')
  })

  test('base.css 不含 root 边框（卡片归属嵌入方）', () => {
    const base = readFileSync(join(stylesDir, 'base.css'), 'utf8')
    const rootBlock = base.split('.typomd-root {')[1]?.split('}')[0] ?? ''
    expect(rootBlock).not.toContain('border')
  })

  test('按钮清零不设 color:inherit（避免压过 toolbar/floating 的 secondary 色）', () => {
    const base = readFileSync(join(stylesDir, 'base.css'), 'utf8')
    const btnBlock = base.split('.typomd-root button {')[1]?.split('}')[0] ?? ''
    expect(btnBlock).not.toContain('color')
  })

  test('toolbar 窄容器可换行且按钮不收缩', () => {
    const toolbar = readFileSync(join(stylesDir, 'toolbar.css'), 'utf8')
    expect(toolbar).toContain('flex-wrap: wrap')
    expect(toolbar).toContain('flex-shrink: 0')
  })

  test('slash 浮层与瓷贴 border-box，宽度含边框', () => {
    const slash = readFileSync(join(stylesDir, 'slash.css'), 'utf8')
    expect(slash).toContain('box-sizing: border-box')
    expect(slash).toContain('max-width: calc(100vw - 16px)')
  })

  test('useFloating 使用 strategy:fixed（与 coordsAtPos 视口坐标对齐）', () => {
    const src = readFileSync(join(__dirname, '..', 'useFloating.ts'), 'utf8')
    expect(src).toContain("strategy: 'fixed'")
  })

  test('Slash / 悬浮条用 *-start 对齐光标而非居中', () => {
    const slash = readFileSync(join(__dirname, '..', 'SlashMenu.tsx'), 'utf8')
    const floating = readFileSync(join(__dirname, '..', 'FloatingToolbar.tsx'), 'utf8')
    expect(slash).toContain("'bottom-start'")
    expect(floating).toContain("'top-start'")
  })
})
