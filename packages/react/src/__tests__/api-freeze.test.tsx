import { describe, expect, test } from 'vitest'

describe('@typomd/react 公共出口冻结', () => {
  test('运行时导出仅 Typomd', async () => {
    const mod = await import('../index')
    expect(Object.keys(mod).sort()).toEqual(['Typomd'])
  })

  test('Typomd 是 forwardRef 组件（$$typeof 存在）', async () => {
    const { Typomd } = await import('../index')
    expect((Typomd as unknown as { $$typeof: symbol }).$$typeof).toBeDefined()
  })
})
