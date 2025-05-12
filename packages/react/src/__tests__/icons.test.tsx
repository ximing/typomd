import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { commandRegistry } from '@typomd/core'
import { icons } from '../icons'
import { SLASH_GROUPS, SLASH_GROUP_ORDER } from '../command-meta'

describe('图标与命令元数据', () => {
  test('每个注册命令的 icon 键都有对应 SVG（§5.2：aria-hidden）', () => {
    for (const spec of commandRegistry.values()) {
      const node = icons[spec.icon]
      expect(node, `缺少图标: ${spec.icon}`).toBeDefined()
      const html = renderToStaticMarkup(<>{node}</>)
      expect(html).toContain('<svg')
      expect(html).toContain('aria-hidden="true"')
    }
  })

  test('slash 分组：showIn 含 slash 的命令全部有分组，且分组均在 ORDER 内', () => {
    const slashIds = [...commandRegistry.values()].filter((s) => s.showIn.includes('slash')).map((s) => s.id)
    expect(slashIds.length).toBeGreaterThanOrEqual(15) // 防 core 注册表悄悄缩水
    for (const id of slashIds) {
      const g = SLASH_GROUPS[id]
      expect(g, `${id} 未分组`).toBeDefined()
      expect(SLASH_GROUP_ORDER).toContain(g)
    }
  })
})
