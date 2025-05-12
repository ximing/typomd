import { describe, expect, test, vi } from 'vitest'
import { editorViewCtx } from '@milkdown/core'
import { createEditor } from '../index'
import { internalHandles } from '../internal'
import { createTestEditor } from './helpers'

function pasteImageFiles(handle: import('../types').EditorHandle, files: File[]) {
  const internal = internalHandles.get(handle)!
  return internal.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    // prosemirror-state@1.4.4 的 d.ts 未暴露 Plugin 实例的 .key（运行时存在，见其 dist/index.js this.key 赋值）；
    // handlePaste 声明 this: Plugin，需 .call 绑定。两者均为上游类型缺口，此处最小 cast，不改运行时语义。
    const plugin = view.state.plugins.find((p) => (p as unknown as { key: string }).key.startsWith('typomd-image-upload'))
    const handled = plugin!.props.handlePaste!.call(
      plugin!,
      view,
      { clipboardData: { files }, preventDefault: () => {} } as unknown as ClipboardEvent,
      undefined as never,
    )
    return handled
  })
}

describe('image 上传钩子（spec §6.1/§8）', () => {
  test('粘贴图片 → 占位节点 → 上传成功替换为 image 节点', async () => {
    const onUploadImage = vi.fn(async (file: File) => ({ src: `https://cdn.example.com/${file.name}` }))
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '', onUploadImage, onChangeDebounce: 0 })
    const file = new File(['png-bytes'], 'a.png', { type: 'image/png' })
    expect(pasteImageFiles(handle, [file])).toBe(true)
    await vi.waitFor(() => {
      expect(handle.getMarkdown()).toContain('(https://cdn.example.com/a.png)')
    })
    expect(onUploadImage).toHaveBeenCalledWith(file)
    handle.destroy()
  })

  test('上传失败 → 保留占位（含文件名）+ onError，占位序列化为 ![name]()', async () => {
    const onError = vi.fn()
    const onUploadImage = vi.fn(async () => { throw new Error('network down') })
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({ root, defaultValue: '', onUploadImage, onError, onChangeDebounce: 0 })
    const file = new File(['x'], 'fail.png', { type: 'image/png' })
    pasteImageFiles(handle, [file])
    await vi.waitFor(() => {
      expect(root.querySelector('.typomd-image-upload.typomd-node-error')).not.toBeNull()
    })
    expect(root.textContent).toContain('fail.png')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'image:upload' }))
    expect(handle.getMarkdown()).toContain('![fail.png]()')
    handle.destroy()
  })

  test('未提供 onUploadImage 时不装载插件（入口禁用）', async () => {
    const handle = await createTestEditor('')
    const internal = internalHandles.get(handle)!
    const has = internal.editor.action((ctx) =>
      ctx.get(editorViewCtx).state.plugins.some((p) => (p as unknown as { key: string }).key.startsWith('typomd-image-upload')),
    )
    expect(has).toBe(false)
    handle.destroy()
  })

  test('insertImageCommand 直接插入图片', async () => {
    const handle = await createTestEditor('')
    handle.execCommand('image', { src: 'https://a.com/x.png', alt: 'x' })
    expect(handle.getMarkdown()).toContain('![x](https://a.com/x.png)')
    handle.destroy()
  })
})
