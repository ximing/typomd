import { describe, expect, test } from 'vitest'

describe('@mdeditor/react 公共出口冻结', () => {
  test('运行时导出仅 MdEditor', async () => {
    const mod = await import('../index')
    expect(Object.keys(mod).sort()).toEqual(['MdEditor'])
  })

  test('MdEditor 是 forwardRef 组件（$$typeof 存在）', async () => {
    const { MdEditor } = await import('../index')
    expect((MdEditor as unknown as { $$typeof: symbol }).$$typeof).toBeDefined()
  })
})
