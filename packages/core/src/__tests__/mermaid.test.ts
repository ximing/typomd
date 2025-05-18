import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (_id: string, code: string) => {
      if (code.includes('INVALID')) throw new Error('parse error')
      return { svg: `<svg data-code="${code.trim()}"></svg>` }
    }),
  },
}))

import { createEditor } from '../index'
import { createTestEditor } from './helpers'

beforeEach(() => vi.clearAllMocks())

describe('mermaid preset', () => {
  test('mermaid 围栏 roundtrip 字符串恒等', async () => {
    const md = '```mermaid\ngraph TD\n    A-->B\n```\n'
    const handle = await createTestEditor(md, { mermaid: true })
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })

  test('启用后渲染为 SVG（nodeView 生效）', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    A-->B\n```\n', features: { mermaid: true },
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.typomd-mermaid svg')).not.toBeNull()
    })
    handle.destroy()
  })

  test('渲染失败 → 源码显示 + 错误角标 + onError（spec §8）', async () => {
    const onError = vi.fn()
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\nINVALID\n```\n', features: { mermaid: true }, onError,
    })
    await vi.waitFor(() => {
      expect(root.querySelector('.typomd-mermaid.typomd-node-error')).not.toBeNull()
    })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ source: 'mermaid:render' }))
    handle.destroy()
  })

  test('普通 js 代码块不受 mermaid 节点影响', async () => {
    const md = '```js\nconst a = 1\n```\n'
    const handle = await createTestEditor(md, { mermaid: true })
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })

  // ---- §5.3 双主题渲染（Task 5）----
  // 测试间缓存隔离铁律（评审 B1）：svgCache 是模块级单例、测试间不清空，
  // 既有测试已把 light:<graph TD A-->B> 写入缓存。每条新测试使用互不相同的
  // mermaid 代码串（C-->D / E-->F / G-->H / I-->J / K-->L），保证缓存 MISS，
  // 使 initialize/render 真正被调用。
  test('渲染使用主题感知的 initialize（light 默认 neutral + tokens 同步值）', async () => {
    const mermaid = (await import('mermaid')).default
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    C-->D\n```', features: { mermaid: true },
    })
    await vi.waitFor(() => expect(root.querySelector('.typomd-mermaid svg')).not.toBeNull())
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({
      startOnLoad: false,
      theme: 'neutral',
      themeVariables: expect.objectContaining({ primaryColor: '#f7f7f5', lineColor: '#5b584f' }),
    }))
    handle.destroy()
  })

  test('.typomd-dark 祖先下用 dark 主题渲染', async () => {
    const mermaid = (await import('mermaid')).default
    const root = document.createElement('div')
    root.classList.add('typomd-dark')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    E-->F\n```', features: { mermaid: true },
    })
    await vi.waitFor(() => expect(root.querySelector('.typomd-mermaid svg')).not.toBeNull())
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({
      themeVariables: expect.objectContaining({ primaryColor: '#242424', lineColor: 'rgba(255,255,255,0.70)' }),
    }))
    handle.destroy()
  })

  test('缓存键含主题：同一代码明暗各渲染一次（§5.3 必要前提）', async () => {
    const mermaid = (await import('mermaid')).default
    const code = 'graph TD\n    G-->H'
    const md = `\`\`\`mermaid\n${code}\n\`\`\`\n`
    // light 渲染一次
    const lightRoot = document.createElement('div')
    document.body.appendChild(lightRoot)
    const h1 = await createEditor({ root: lightRoot, defaultValue: md, features: { mermaid: true } })
    await vi.waitFor(() => expect(lightRoot.querySelector('svg')).not.toBeNull())
    const callsAfterLight = (mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length
    // dark 渲染同一代码——不得命中 light 缓存（键不同：`dark:` vs `light:`）
    const darkRoot = document.createElement('div')
    darkRoot.classList.add('typomd-dark')
    document.body.appendChild(darkRoot)
    const h2 = await createEditor({ root: darkRoot, defaultValue: md, features: { mermaid: true } })
    await vi.waitFor(() => expect(darkRoot.querySelector('svg')).not.toBeNull())
    expect((mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterLight + 1)
    // 再建一个 light 实例渲染同一代码——必须命中 `light:` 缓存，render 不再新增调用
    const lightRoot2 = document.createElement('div')
    document.body.appendChild(lightRoot2)
    const h3 = await createEditor({ root: lightRoot2, defaultValue: md, features: { mermaid: true } })
    await vi.waitFor(() => expect(lightRoot2.querySelector('svg')).not.toBeNull())
    expect((mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterLight + 1)
    h1.destroy(); h2.destroy(); h3.destroy()
  })

  test('主题类变化触发重渲染（MutationObserver 挂 documentElement）', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    I-->J\n```', features: { mermaid: true },
    })
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    const mermaid = (await import('mermaid')).default
    const before = (mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length
    document.documentElement.classList.add('typomd-dark')
    await vi.waitFor(() =>
      expect((mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(before))
    document.documentElement.classList.remove('typomd-dark')
    handle.destroy()
  })

  test('注入自定义 themes 生效（CreateEditorOptions.mermaidThemes → fc 透传，M1）', async () => {
    const mermaid = (await import('mermaid')).default
    const root = document.createElement('div')
    document.body.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    K-->L\n```', features: { mermaid: true },
      mermaidThemes: { light: { theme: 'forest' } },
    })
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'forest' }))
    handle.destroy()
  })

  test('主题类变化触发重渲染（MutationObserver 挂 .typomd-root 库根，§5.3）', async () => {
    // 嵌入方把主题类挂在 .typomd-root（React wrapper 库根），而非 <html>。
    // 专属代码串 M-->N（B1 缓存隔离）。
    const libRoot = document.createElement('div')
    libRoot.classList.add('typomd-root')
    document.body.appendChild(libRoot)
    const root = document.createElement('div')
    libRoot.appendChild(root)
    const handle = await createEditor({
      root, defaultValue: '```mermaid\ngraph TD\n    M-->N\n```', features: { mermaid: true },
    })
    await vi.waitFor(() => expect(root.querySelector('svg')).not.toBeNull())
    const mermaid = (await import('mermaid')).default
    const before = (mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length
    // 在 .typomd-root（非 documentElement）上切换主题类——必须触发重渲染
    libRoot.classList.add('typomd-dark')
    await vi.waitFor(() =>
      expect((mermaid.render as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(before))
    libRoot.classList.remove('typomd-dark')
    handle.destroy()
  })
})
