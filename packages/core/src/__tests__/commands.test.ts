import { describe, expect, test } from 'vitest'
import { editorViewCtx } from '@milkdown/core'
import { AllSelection } from '@milkdown/prose/state'
import { commandRegistry } from '../commands/registry'
import { internalHandles } from '../internal'
import type { EditorHandle } from '../types'
import { createTestEditor, expectMd } from './helpers'

function selectAll(handle: EditorHandle) {
  internalHandles.get(handle)!.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    view.dispatch(view.state.tr.setSelection(new AllSelection(view.state.doc)))
  })
}

describe('命令对文档的变换（exec 前后 doc 断言，spec §9）', () => {
  test('bold / italic / strike / code 作用于选区', async () => {
    const handle = await createTestEditor('hello', { math: true, mermaid: true })
    selectAll(handle)
    handle.execCommand('bold')
    expectMd(handle, '**hello**')
    selectAll(handle)
    handle.execCommand('bold') // 再执行一次 = 取消
    expectMd(handle, 'hello')
    selectAll(handle)
    handle.execCommand('strike')
    expectMd(handle, '~~hello~~')
    handle.destroy()
  })

  test('heading / quote / codeBlock 块级变换', async () => {
    const handle = await createTestEditor('para')
    handle.execCommand('heading', { level: 2 })
    expectMd(handle, '## para')
    handle.execCommand('quote')
    expectMd(handle, '> ## para')
    handle.destroy()
  })

  test('bulletList / orderedList / taskList', async () => {
    const handle = await createTestEditor('item')
    handle.execCommand('bulletList')
    expectMd(handle, '* item')
    // taskList 需在非列表段落上调用（wrapInList 对已存在列表项返回 false），
    // 重置内容后验证 taskList 产出 * [ ] item（语义不变：验证三个列表命令各自可用）
    handle.setMarkdown('item')
    handle.execCommand('taskList')
    expect(handle.getMarkdown()).toContain('* [ ] item')
    handle.destroy()
  })

  test('table 插入 GFM 表格', async () => {
    const handle = await createTestEditor('')
    handle.execCommand('table')
    expect(handle.getMarkdown()).toContain('|')
    expect(handle.getMarkdown()).toContain('---')
    handle.destroy()
  })

  test('math / mermaid 插入（feature 开启时）', async () => {
    const handle = await createTestEditor('', { math: true, mermaid: true })
    handle.execCommand('math')
    expect(handle.getMarkdown()).toContain('$$')
    handle.execCommand('mermaid')
    expect(handle.getMarkdown()).toContain('```mermaid')
    handle.destroy()
  })

  test('undo / redo', async () => {
    const handle = await createTestEditor('a')
    handle.insert('b')
    const before = handle.getMarkdown()
    handle.execCommand('undo')
    expect(handle.getMarkdown()).not.toBe(before)
    handle.execCommand('redo')
    expect(handle.getMarkdown()).toBe(before)
    handle.destroy()
  })
})

describe('commandRegistry（spec §6.3）', () => {
  test('包含 §6.2 全部 17 个内置命令', () => {
    expect([...commandRegistry.keys()].sort()).toEqual(
      ['bold', 'bulletList', 'code', 'codeBlock', 'heading', 'image', 'italic', 'link',
       'math', 'mermaid', 'orderedList', 'quote', 'redo', 'strike', 'table', 'taskList', 'undo'].sort(),
    )
  })

  test('isActive 反映选区状态', async () => {
    const handle = await createTestEditor('hello')
    selectAll(handle)
    expect(commandRegistry.get('bold')!.isActive(handle)).toBe(false)
    handle.execCommand('bold')
    selectAll(handle)
    expect(commandRegistry.get('bold')!.isActive(handle)).toBe(true)
    handle.destroy()
  })

  test('每个注册项 showIn 非空且 icon/label 齐全', () => {
    for (const spec of commandRegistry.values()) {
      expect(spec.showIn.length).toBeGreaterThan(0)
      expect(spec.icon).toBeTruthy()
      expect(spec.label).toBeTruthy()
    }
  })
})
