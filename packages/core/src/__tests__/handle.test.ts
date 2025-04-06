import { afterEach, describe, expect, test, vi } from 'vitest'
import { editorViewCtx } from '@milkdown/core'
import { createEditor } from '../index'
import { internalHandles } from '../internal'
import { createTestEditor, expectMd } from './helpers'

afterEach(() => vi.useRealTimers())

describe('onChange 双格式 + debounce', () => {
  test('debounce=0 时同步触发，载荷为 (markdown, json)', async () => {
    const onChange = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '# A', onChange, onChangeDebounce: 0 })
    handle.insert('para')
    expect(onChange).toHaveBeenCalled()
    const [md, json] = onChange.mock.lastCall!
    expect(md).toContain('para')
    expect(json).toMatchObject({ type: 'doc' })
    handle.destroy()
  })

  test('debounce=300 时合并触发一次', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '# A', onChange, onChangeDebounce: 300 })
    handle.insert('x')
    handle.insert('y')
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.lastCall![0]).toContain('y')
    handle.destroy()
  })
})

describe('setMarkdown 三语义（spec §6.1）', () => {
  test('替换本身不触发 onChange', async () => {
    const onChange = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '# A', onChange, onChangeDebounce: 0 })
    handle.setMarkdown('# B')
    expect(onChange).not.toHaveBeenCalled()
    expectMd(handle, '# B')
    handle.destroy()
  })

  test('取消 pending 的 debounced onChange', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '# A', onChange, onChangeDebounce: 300 })
    handle.insert('x')
    handle.setMarkdown('# New')
    vi.advanceTimersByTime(1000)
    expect(onChange).not.toHaveBeenCalled()
    handle.destroy()
  })

  test('清空 undo 历史', async () => {
    const handle = await createTestEditor('# A')
    handle.setMarkdown('# B')
    handle.execCommand('undo')
    expectMd(handle, '# B')
    handle.destroy()
  })
})

describe('setReadOnly / insert / execCommand', () => {
  test('setReadOnly(true) 后 editable 闭包返回 false', async () => {
    const handle = await createTestEditor('# A')
    const internal = internalHandles.get(handle)!
    const editableOf = () =>
      internal.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        return view.props.editable!(view.state)
      })
    expect(editableOf()).toBe(true)
    handle.setReadOnly(true)
    expect(editableOf()).toBe(false)
    handle.setReadOnly(false)
    expect(editableOf()).toBe(true)
    handle.destroy()
  })

  test('未知命令通过 onError 上报且不抛错', async () => {
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '# A', onError })
    handle.execCommand('nope')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'command' }))
    handle.destroy()
  })
})

describe('preset 初始化失败隔离（spec §8）', () => {
  test('单个 feature loader 抛错：onError 上报 + 编辑器其余功能正常', async () => {
    vi.resetModules()
    vi.doMock('../presets/index', async (importOriginal) => {
      const original = await importOriginal<typeof import('../presets/index')>()
      return {
        ...original,
        featureLoaders: {
          ...original.featureLoaders,
          math: () => { throw new Error('boom') },
        },
      }
    })
    const { createEditor: createEditorMocked } = await import('../editor')
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditorMocked({
      root, defaultValue: '# A', features: { math: true }, onError,
    })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'preset:math' }))
    expectMd(handle, '# A')
    handle.destroy()
    vi.doUnmock('../presets/index')
    vi.resetModules()
  })
})
