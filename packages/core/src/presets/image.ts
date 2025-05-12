// presets/image.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import { $nodeSchema, $prose, $view } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import { imageSchema, paragraphSchema } from '@milkdown/preset-commonmark'
import type { FeatureContext } from './index'

/** 上传占位节点：transient 存在于上传中/上传失败态 */
export const imageUploadSchema = $nodeSchema('image_upload', () => ({
  group: 'block',
  atom: true,
  attrs: {
    name: { default: '', validate: 'string' },
    uploadId: { default: '', validate: 'string' },
  },
  parseDOM: [{ tag: 'div[data-image-upload]' }],
  toDOM: (node) => ['div', { 'data-image-upload': '' }, node.attrs.name as string],
  parseMarkdown: {
    // 占位节点不从 markdown 解析（`![name]()` 由 commonmark image 接管）
    match: () => false,
    runner: () => {},
  },
  toMarkdown: {
    match: (node) => node.type.name === 'image_upload',
    runner: (state, node) => {
      state.addNode('image', undefined, undefined, { url: '', alt: node.attrs.name as string })
    },
  },
}))

// 图片插入命令使用 preset-commonmark 内置的 insertImageCommand（dispatch.ts 直接 import，本文件不定义）。
// 占位 nodeView 需要拿到触发上传时的 File：nodeView 构造签名拿不到自定义数据，因此 File 通过
// 「uploadId → File」的模块级注册表传递——paste/drop 插件插入占位节点时生成自增 uploadId 写入 attrs
// 并登记 File，nodeView 用 node.attrs.uploadId 取 File。
const uploadFiles = new Map<string, File>()
let uploadSeq = 0

export const imageUploadView = (fc: FeatureContext) =>
  $view(imageUploadSchema.node, (ctx): NodeViewConstructor => {
    return (node, view, getPos) => {
      const file = uploadFiles.get(node.attrs.uploadId as string)
      const dom = document.createElement('div')
      dom.classList.add('typomd-image-upload')
      dom.textContent = `上传中：${node.attrs.name}`
      if (!file) return { dom } // 无 File（如 setMarkdown 重建出占位）→ 仅展示

      const upload = () => {
        fc.onUploadImage!(file)
          .then(({ src, alt }) => {
            const pos = typeof getPos === 'function' ? getPos() : undefined
            if (typeof pos !== 'number') return
            // 已核实：commonmark image 是 inline 节点，而占位是 block，
            // 直接用 inline 节点 replaceWith block 位置会抛 "Invalid content"——
            // 必须包一层 paragraph 再替换
            const imageNode = imageSchema.type(ctx).create({ src, alt: alt ?? file.name })
            const paragraph = paragraphSchema.type(ctx).create(null, imageNode)
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, paragraph))
            uploadFiles.delete(node.attrs.uploadId as string)
          })
          .catch((cause) => {
            // spec §8：保留占位节点（含文件名）+ onError，点击重试
            dom.classList.add('typomd-node-error')
            dom.textContent = `上传失败：${file.name}（点击重试）`
            fc.onError({ source: 'image:upload', cause })
          })
      }
      upload()
      dom.addEventListener('click', upload)
      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false
          node = updated
          return true
        },
        stopEvent: () => true,
        ignoreMutation: () => true,
        destroy: () => dom.removeEventListener('click', upload),
      }
    }
  })

const imageUploadKey = new PluginKey('typomd-image-upload')

export function createImageUploadPlugins(fc: FeatureContext): MilkdownPlugin[] {
  const pasteDropPlugin = $prose((ctx) => {
    const placeholderType = imageUploadSchema.type(ctx)
    const insertPlaceholders = (view: import('@milkdown/prose/view').EditorView, files: File[]) => {
      const nodes = files.map((file) => {
        const uploadId = `up-${uploadSeq++}`
        uploadFiles.set(uploadId, file)
        return placeholderType.create({ name: file.name, uploadId })
      })
      const tr = view.state.tr.replaceSelectionWith(nodes[0]!)
      let pos = tr.selection.$from.pos
      for (const n of nodes.slice(1)) {
        tr.insert(pos, n)
        pos += n.nodeSize
      }
      view.dispatch(tr.scrollIntoView())
    }
    return new Plugin({
      key: imageUploadKey,
      props: {
        handlePaste: (view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
          if (files.length === 0) return false
          event.preventDefault()
          insertPlaceholders(view, files)
          return true
        },
        handleDrop: (view, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
          if (files.length === 0) return false
          event.preventDefault()
          insertPlaceholders(view, files)
          return true
        },
      },
    })
  })
  // whole-tuple（与 Task 8 math/index.ts 同模式）：$nodeSchema 返回 [schemaCtx, schema] 元组，
  // 仅 .node 会丢 schemaCtx → Context "image_upload" not found。$view/$prose 返回单 plugin，保持原样。
  return [imageUploadSchema, imageUploadView(fc), pasteDropPlugin].flat() as MilkdownPlugin[]
}
