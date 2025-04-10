// presets/mermaid/view.ts
import { $view } from '@milkdown/utils'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import mermaid from 'mermaid'
import { mermaidSchema } from './schema'
import { mermaidFeatureCtx } from './ctx'
import type { EditorError } from '../../types'

/** LRU 缓存（spec §5.3）：code → svg，容量 50 */
class LruCache {
  private map = new Map<string, string>()
  constructor(private cap = 50) {}
  get(k: string) {
    const v = this.map.get(k)
    if (v !== undefined) { this.map.delete(k); this.map.set(k, v) }
    return v
  }
  set(k: string, v: string) {
    if (this.map.has(k)) this.map.delete(k)
    this.map.set(k, v)
    if (this.map.size > this.cap) this.map.delete(this.map.keys().next().value!)
  }
}

const svgCache = new LruCache(50)
let initialized = false
let seq = 0

async function renderMermaid(code: string): Promise<string> {
  const cached = svgCache.get(code)
  if (cached) return cached
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false })
    initialized = true
  }
  const { svg } = await mermaid.render(`mdeditor-mermaid-${seq++}`, code)
  svgCache.set(code, svg)
  return svg
}

function createMermaidView(onError: (e: EditorError) => void): NodeViewConstructor {
  return (node, view, getPos) => {
    const dom = document.createElement('div')
    dom.classList.add('mdeditor-mermaid')
    const preview = document.createElement('div')
    dom.appendChild(preview)
    let observer: IntersectionObserver | undefined
    let rendered = false

    const render = async (value: string) => {
      try {
        preview.innerHTML = await renderMermaid(value)
        dom.classList.remove('mdeditor-node-error')
        rendered = true
      } catch (cause) {
        // spec §8：保留源码可继续编辑 + 红色错误角标
        preview.textContent = value
        dom.classList.add('mdeditor-node-error')
        onError({ source: 'mermaid:render', cause })
      }
    }

    // 视口内懒渲染（spec §5.3）；无 IntersectionObserver 的环境（jsdom）直接渲染
    const lazyRender = (value: string) => {
      if (typeof IntersectionObserver === 'undefined') { void render(value); return }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer?.disconnect()
          void render(value)
        }
      })
      observer.observe(dom)
    }
    lazyRender(node.attrs.value as string)

    // 点击进入源码编辑态（spec §5.2 Typora 式）
    const startEdit = () => {
      observer?.disconnect()
      const textarea = document.createElement('textarea')
      textarea.value = node.attrs.value as string
      dom.replaceChildren(textarea)
      textarea.focus()
      const commit = () => {
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos === 'number') {
          view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { value: textarea.value }))
        }
        dom.replaceChildren(preview)
        void render(textarea.value)
      }
      textarea.addEventListener('blur', commit)
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { dom.replaceChildren(preview); void render(node.attrs.value as string) }
      })
    }
    dom.addEventListener('click', startEdit)

    return {
      dom,
      update: (updated) => {
        if (updated.type.name !== node.type.name) return false
        node = updated
        if (rendered) void render(updated.attrs.value as string)
        return true
      },
      stopEvent: (event) => event.target instanceof HTMLTextAreaElement,
      ignoreMutation: () => true,
      destroy: () => { observer?.disconnect(); dom.removeEventListener('click', startEdit) },
    }
  }
}

export const mermaidView = $view(mermaidSchema.node, (ctx): NodeViewConstructor =>
  createMermaidView(ctx.get(mermaidFeatureCtx).onError))
