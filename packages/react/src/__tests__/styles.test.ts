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
    expect(base).toContain('--mdeditor-color-focus-ring')
    expect(base).toContain('prefers-reduced-motion')
  })

  test('base.css 不含 root 边框（卡片归属嵌入方）', () => {
    const base = readFileSync(join(stylesDir, 'base.css'), 'utf8')
    const rootBlock = base.split('.mdeditor-root {')[1]?.split('}')[0] ?? ''
    expect(rootBlock).not.toContain('border')
  })
})
