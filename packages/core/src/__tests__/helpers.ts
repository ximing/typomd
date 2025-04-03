import { expect } from 'vitest'
import { createEditor } from '../index'
import type { EditorHandle, FeatureFlags } from '../types'

export async function createTestEditor(defaultValue: string, features?: FeatureFlags): Promise<EditorHandle> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const handle = await createEditor({ root, defaultValue, onChangeDebounce: 0, ...(features ? { features } : {}) })
  return handle
}

/**
 * getMarkdown 断言的统一入口。
 * 已核实：mdast-util-to-markdown@2 的输出以 '\n' 结尾，Milkdown 的 getMarkdown 不做 trim，
 * 因此所有「内容相等」断言必须走这个 trimEnd 包装，禁止直接 toBe 字面量。
 * （canonical fixture 的字符串恒等断言除外——fixture 文件本身以恰好一个 '\n' 结尾，见 Task 4。）
 */
export function expectMd(handle: EditorHandle, expected: string): void {
  expect(handle.getMarkdown().trimEnd()).toBe(expected.trimEnd())
}
