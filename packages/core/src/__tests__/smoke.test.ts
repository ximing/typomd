import { describe, expect, test } from 'vitest'
import { createTestEditor, expectMd } from './helpers'

describe('createEditor smoke', () => {
  test('挂载后 getMarkdown 返回规范化 markdown', async () => {
    const handle = await createTestEditor('# Hello')
    expectMd(handle, '# Hello')
    handle.destroy()
  })

  test('setMarkdown 替换全文，getJSON 返回 ProseMirror JSON', async () => {
    const handle = await createTestEditor('# A')
    handle.setMarkdown('# B')
    expectMd(handle, '# B')
    expect(handle.getJSON()).toMatchObject({ type: 'doc' })
    handle.destroy()
  })

  test('destroy 后调用方法抛错', async () => {
    const handle = await createTestEditor('# A')
    handle.destroy()
    expect(() => handle.getMarkdown()).toThrow('destroy')
  })
})
