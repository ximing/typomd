// presets/code-highlight.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import type { Node as PMNode } from '@milkdown/prose/model'
import { createHighlighter, type Highlighter } from 'shiki'
import type { FeatureContext } from './index'

const DEFAULT_LANGS = ['javascript', 'typescript', 'json', 'html', 'css', 'markdown', 'bash', 'python', 'yaml']
const LIGHT = 'github-light'
const DARK = 'github-dark'

const shikiKey = new PluginKey<DecorationSet>('mdeditor-shiki')

function buildDecorations(
  doc: PMNode,
  highlighter: Highlighter,
  requestLang: (lang: string) => void,
): DecorationSet {
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== 'code_block') return
    const lang = (node.attrs.language as string) || 'text'
    const code = node.textContent
    if (!code) return
    if (lang !== 'text' && !highlighter.getLoadedLanguages().includes(lang)) {
      requestLang(lang) // 语言包按需异步加载（spec §5.3）；本次先渲染为纯文本
      return
    }
    let themed
    try {
      themed = highlighter.codeToTokens(code, {
        lang: (lang === 'text' ? 'text' : lang) as never,
        themes: { light: LIGHT, dark: DARK },
      })
    } catch {
      return // 任何 tokenize 失败：该块回退纯文本
    }
    let offset = pos + 1
    for (const line of themed.tokens) {
      for (const token of line) {
        const from = offset
        offset += token.content.length
        // 已核实 @shikijs/types@3：TokenStyles.htmlStyle 是 Record<string, string>
        // （双主题时含 color 与 --shiki-dark 等键），不是 string——必须序列化拼接
        const style = token.htmlStyle
          ? Object.entries(token.htmlStyle).map(([k, v]) => `${k}:${v}`).join(';')
          : token.color
            ? `color:${token.color}`
            : undefined
        if (style) decos.push(Decoration.inline(from, offset, { style }))
      }
      offset += 1 // 每行末尾的换行符
    }
  })
  return DecorationSet.create(doc, decos)
}

export function codeHighlightPreset(fc: FeatureContext): MilkdownPlugin[] {
  const plugin = $prose(() => {
    let highlighter: Highlighter | undefined
    const requested = new Set<string>()

    return new Plugin({
      key: shikiKey,
      state: {
        init: () => DecorationSet.empty,
        apply: (tr, set) => {
          const meta = tr.getMeta(shikiKey)
          if (meta) return meta as DecorationSet
          return tr.docChanged ? set.map(tr.mapping, tr.doc) : set
        },
      },
      props: {
        decorations(state) {
          return shikiKey.getState(state)
        },
      },
      view: (view) => {
        let disposed = false

        const refresh = () => {
          if (!highlighter || disposed) return
          const set = buildDecorations(view.state.doc, highlighter, requestLang)
          view.dispatch(view.state.tr.setMeta(shikiKey, set))
        }
        const requestLang = (lang: string) => {
          if (requested.has(lang) || !highlighter) return
          const h = highlighter
          requested.add(lang)
          // 用 Promise.resolve().then 包裹：shiki 的 loadLanguage 对不在 bundle 中的语言
          // 会同步抛 ShikiError（resolveLang 内），而非返回 rejected promise。
          // 不包裹则同步异常上冒到 createHighlighter().then() 的 catch，错标为 :init。
          Promise.resolve()
            .then(() => h.loadLanguage(lang as never))
            .then(() => { requested.delete(lang); refresh() })
            .catch((cause) => {
              // spec §8：语言包加载失败 → 回退无高亮纯文本
              requested.delete(lang)
              fc.onError({ source: 'codeHighlight', cause })
            })
        }

        createHighlighter({ themes: [LIGHT, DARK], langs: DEFAULT_LANGS })
          .then((h) => { if (disposed) return; highlighter = h; refresh() })
          .catch((cause) => fc.onError({ source: 'codeHighlight:init', cause }))

        return {
          update: (view, prev) => {
            if (highlighter && !view.state.doc.eq(prev.doc)) refresh()
          },
          destroy: () => { disposed = true },
        }
      },
    })
  })
  return [plugin]
}
