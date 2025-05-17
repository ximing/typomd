// presets/mermaid/view.ts
import { $view } from '@milkdown/utils'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'
import { mermaidSchema } from './schema'
import { mermaidFeatureCtx } from './ctx'
import type { EditorError } from '../../types'

/** LRU 缓存（spec §5.3）：`${theme}:${code}` → svg，容量 50 */
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
let seq = 0

// 默认主题（§5.3，与 tokens.json §4.2 手工同步——check-colors 白名单覆盖 mermaid 目录）。
// mermaid 渲染在 JS 内进行、读不到 CSS 变量，色值必须与令牌手工同步（对比度由 theme 单测覆盖）。
const DEFAULT_THEMES = {
  light: {
    theme: 'neutral',
    themeVariables: {
      background: '#ffffff',
      primaryColor: '#f7f7f5',
      primaryBorderColor: 'rgba(55,53,47,0.16)',
      primaryTextColor: '#37352f',
      lineColor: '#5b584f',
    },
  },
  dark: {
    theme: 'neutral',
    themeVariables: {
      background: '#1a1a1a',
      primaryColor: '#242424',
      primaryBorderColor: 'rgba(255,255,255,0.18)',
      primaryTextColor: 'rgba(255,255,255,0.85)',
      lineColor: 'rgba(255,255,255,0.70)',
    },
  },
} as const

type MermaidTheme = 'light' | 'dark'
type ThemeSet = { light?: MermaidConfig; dark?: MermaidConfig }

/** 主题探测（§5.3）：与 CSS 机制同判据——祖先 .typomd-dark；auto.css 媒体查询模式退化 matchMedia */
function detectTheme(el: HTMLElement): MermaidTheme {
  // 嵌入方可能把类挂在库根 .typomd-root 或 html——closest 向上穿透两者
  if (el.closest('.typomd-dark')) return 'dark'
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

/** 渲染并缓存；缓存键含主题（§5.3 必要前提），否则主题切换重渲染命中旧主题 SVG 沦为视觉 no-op */
async function renderMermaid(code: string, theme: MermaidTheme, themes?: ThemeSet): Promise<string> {
  const key = `${theme}:${code}`
  const cached = svgCache.get(key)
  if (cached) return cached
  // initialize 是全局配置：主题切换必须按当前主题重调（由「只 initialize 一次」改为每次渲染按主题调用）
  mermaid.initialize({ startOnLoad: false, ...(themes?.[theme] ?? DEFAULT_THEMES[theme]) } as MermaidConfig)
  const { svg } = await mermaid.render(`typomd-mermaid-${seq++}`, code)
  svgCache.set(key, svg)
  return svg
}

function createMermaidView(onError: (e: EditorError) => void, themes?: ThemeSet): NodeViewConstructor {
  return (node, view, getPos) => {
    const dom = document.createElement('div')
    dom.classList.add('typomd-mermaid')
    const preview = document.createElement('div')
    dom.appendChild(preview)
    let observer: IntersectionObserver | undefined
    let themeObserver: MutationObserver | undefined
    let rendered = false

    const render = async (value: string) => {
      const theme = detectTheme(dom)
      try {
        // 重渲染时不走骨架块（避免闪烁）：先 await 新 SVG 再替换，旧 SVG 保留到新 SVG 就绪
        preview.innerHTML = await renderMermaid(value, theme, themes)
        dom.classList.remove('typomd-node-error')
        rendered = true
      } catch (cause) {
        // spec §8：保留源码可继续编辑 + 红色错误角标
        preview.textContent = value
        dom.classList.add('typomd-node-error')
        onError({ source: 'mermaid:render', cause })
      }
    }

    // 视口内懒渲染（spec §5.3）；无 IntersectionObserver 的环境（jsdom）直接渲染。
    // 骨架块只在首次渲染路径放置（§5.3）：render 完成后替换；重渲染路径不走骨架避免闪烁。
    // 延迟到微任务启动渲染：构造时 dom 尚未挂载到文档，detectTheme 需祖先链（closest('.typomd-dark')），
    // 微任务在 ProseMirror 同步挂载 dom 之后执行，此时 detectTheme 可正确读取主题。
    const lazyRender = (value: string) => {
      if (!rendered) {
        preview.innerHTML = ''
        const sk = document.createElement('div')
        sk.className = 'typomd-skeleton'
        preview.appendChild(sk)
      }
      const kickoff = () => {
        if (typeof IntersectionObserver === 'undefined') { void render(value); return }
        observer = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect()
            void render(value)
          }
        })
        observer.observe(dom)
      }
      queueMicrotask(kickoff)
    }
    lazyRender(node.attrs.value as string)

    // 主题变化重渲染（§5.3）：观察 documentElement class（demo 把主题类挂在 <html>）
    // 以及最近的 .typomd-root 祖先 class（嵌入方把类挂在库根）。挂在中间层容器属已知限制（文档明示）。
    themeObserver = new MutationObserver(() => {
      if (rendered) void render(node.attrs.value as string)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const libRoot = dom.closest('.typomd-root')
    if (libRoot instanceof HTMLElement) themeObserver.observe(libRoot, { attributes: true, attributeFilter: ['class'] })

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
      destroy: () => {
        observer?.disconnect()
        themeObserver?.disconnect()
        dom.removeEventListener('click', startEdit)
      },
    }
  }
}

export const mermaidView = $view(mermaidSchema.node, (ctx): NodeViewConstructor => {
  const cfg = ctx.get(mermaidFeatureCtx)
  return createMermaidView(cfg.onError, cfg.themes)
})
