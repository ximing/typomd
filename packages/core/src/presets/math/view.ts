// presets/math/view.ts
import { $view } from '@milkdown/utils'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import katex from 'katex'
import { mathBlockSchema, mathInlineSchema } from './schema'
import { mathFeatureCtx } from './ctx'
import type { EditorError } from '../../types'

function createMathView(displayMode: boolean, onError: (e: EditorError) => void): NodeViewConstructor {
  return (node, view, getPos) => {
    const dom = document.createElement(displayMode ? 'div' : 'span')
    dom.classList.add('typomd-math')
    const preview = document.createElement(displayMode ? 'div' : 'span')
    dom.appendChild(preview)

    const render = (value: string) => {
      try {
        katex.render(value, preview, { displayMode, throwOnError: true })
        dom.classList.remove('typomd-node-error')
        dom.removeAttribute('data-error')
      } catch (cause) {
        // spec §8：渲染失败 → 显示源码 + 红色错误角标，不阻断编辑
        preview.textContent = value
        dom.classList.add('typomd-node-error')
        dom.setAttribute('data-error', 'math')
        onError({ source: 'math:render', cause })
      }
    }
    render(node.attrs.value as string)

    // 点击进入编辑态：nodeView 内嵌输入框，blur/Enter 提交
    const startEdit = () => {
      const input = document.createElement(displayMode ? 'textarea' : 'input')
      input.value = node.attrs.value as string
      dom.replaceChildren(input)
      input.focus()
      const commit = () => {
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos === 'number') {
          view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { value: input.value }))
        }
        dom.replaceChildren(preview)
        render(input.value)
      }
      input.addEventListener('blur', commit)
      input.addEventListener('keydown', (e) => {
        const ev = e as KeyboardEvent
        if (ev.key === 'Enter' && !displayMode) { e.preventDefault(); commit() }
        if (ev.key === 'Escape') { dom.replaceChildren(preview); render(node.attrs.value as string) }
      })
    }
    dom.addEventListener('click', startEdit)

    return {
      dom,
      update: (updated) => {
        if (updated.type.name !== node.type.name) return false
        node = updated
        render(updated.attrs.value as string)
        return true
      },
      stopEvent: (event) => event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement,
      ignoreMutation: () => true,
      destroy: () => dom.removeEventListener('click', startEdit),
    }
  }
}

export const mathInlineView = $view(mathInlineSchema.node, (ctx): NodeViewConstructor =>
  createMathView(false, ctx.get(mathFeatureCtx).onError))

export const mathBlockView = $view(mathBlockSchema.node, (ctx): NodeViewConstructor =>
  createMathView(true, ctx.get(mathFeatureCtx).onError))
