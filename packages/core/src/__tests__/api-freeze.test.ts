import { describe, expect, test } from 'vitest'
import { commandRegistry } from '../commands/registry'
import { createTestEditor } from './helpers'

describe('EditorHandle API 冻结', () => {
  test('handle 方法面逐字冻结', async () => {
    const handle = await createTestEditor('# A')
    expect(Object.keys(handle).sort()).toEqual([
      'destroy',
      'execCommand',
      'focus',
      'getJSON',
      'getMarkdown',
      'insert',
      'on',
      'setMarkdown',
      'setReadOnly',
    ])
    handle.destroy()
  })

  test('包公共出口冻结（运行时导出仅 createEditor 与 commandRegistry）', async () => {
    const mod = await import('../index')
    expect(Object.keys(mod).sort()).toEqual(['commandRegistry', 'createEditor'])
  })

  test('commandRegistry 注册项形状冻结', () => {
    for (const [id, spec] of commandRegistry) {
      expect(spec.id).toBe(id)
      expect(Object.keys(spec).sort()).toEqual(['exec', 'icon', 'id', 'isActive', 'label', 'showIn'])
    }
  })
})
