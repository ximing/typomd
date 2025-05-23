// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { Typomd, type EditorHandle, type FeatureFlags } from '@typomd/react'
import { DEMO_MARKDOWN } from './fixtures'

const FEATURE_KEYS = ['math', 'mermaid', 'codeHighlight', 'slash', 'floatingToolbar'] as const

// §5.8 顶栏图标：内联 Lucide 风格 16px SVG（与 packages/react/src/icons.tsx 同制式，
// 但 demo 自带——api-freeze 不导出图标，不从 react 包 import）。stroke=currentColor、aria-hidden。
const GithubIcon = (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 22v-2a8.94 8.94 0 0 0 2.32-5.09 9 9 0 0 0-3.57-7.71 8.84 8.84 0 0 0-4-1.94 9.08 9.08 0 0 0-5.62 1.84 9 9 0 0 0-1.12 13.39 9.04 9.04 0 0 0 3.65 2.51v2" />
    <path d="M9 22v-2" />
  </svg>
)
// dark 态显示太阳（点击切回亮色），亮态显示月亮（点击切到暗色）
const SunIcon = (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
)
const MoonIcon = (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

// §6 主题键：与 index.html 防闪烁脚本读同一键、同一语义（'dark' | 'light' | null）
const THEME_KEY = 'typomd-demo-theme'

function initialDark(): boolean {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  } catch { return false }
}

export function App() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    math: true, mermaid: true, codeHighlight: true, slash: true, floatingToolbar: true,
  })
  const [dark, setDark] = useState(initialDark)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [output, setOutput] = useState(DEMO_MARKDOWN)
  const [editorKey, setEditorKey] = useState(0)
  const handleRef = useRef<EditorHandle | null>(null)

  const features: FeatureFlags = Object.fromEntries(FEATURE_KEYS.map((k) => [k, enabled[k]]))

  // 类挂 <html>（§6：.demo-page 选择器是后代选择器，html 挂类整页生效）
  useEffect(() => {
    document.documentElement.classList.toggle('typomd-dark', dark)
  }, [dark])

  // 未显式切换过时跟随系统（§6：仅无 localStorage 记录时响应 change）
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      try { if (!localStorage.getItem(THEME_KEY)) setDark(e.matches) } catch { /* noop */ }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = () => {
    setDark((v) => {
      const next = !v
      try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light') } catch { /* noop */ }
      return next
    })
  }

  const toggleFeature = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
    setEditorKey((k) => k + 1) // 非受控语义：demo 通过 key 重建编辑器
  }

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-brand">
          <span className="demo-logo" aria-hidden="true">T</span>
          <div className="demo-brand-text">
            <h1 className="demo-title">typomd</h1>
            <p className="demo-tagline">Milkdown 驱动的 Markdown 编辑器组件库</p>
          </div>
        </div>
        <nav className="demo-header-actions">
          <a className="demo-link" href="https://github.com/ximing/typomd" target="_blank" rel="noreferrer">
            {GithubIcon}{' '}GitHub
          </a>
          <button
            className="demo-btn"
            data-testid="theme-toggle"
            aria-label={dark ? '切换到亮色主题' : '切换到暗色主题'}
            onClick={toggleTheme}
          >
            {dark ? SunIcon : MoonIcon}
          </button>
        </nav>
      </header>

      <main className="demo-main">
        <section className="demo-editor-card" data-testid="demo-editor">
          <Typomd
            key={editorKey}
            ref={handleRef}
            defaultValue={DEMO_MARKDOWN}
            features={features}
            toolbar={{ visible: toolbarVisible }}
            placeholder="输入 / 唤起命令..."
            onChange={(md) => setOutput(md)}
            onChangeDebounce={300}
            onError={(e) => console.error('[demo]', e)}
            onUploadImage={async (file) => ({ src: URL.createObjectURL(file), alt: file.name })}
          />
        </section>

        <section className="demo-section">
          <h2 className="demo-section-title">功能开关</h2>
          <div className="demo-switches">
            {FEATURE_KEYS.map((key) => (
              <label key={key} className="demo-switch">
                <input
                  type="checkbox"
                  data-testid={`feature-${key}`}
                  checked={!!enabled[key]}
                  onChange={() => toggleFeature(key)}
                />
                <span className="demo-switch-track" />
                <span className="demo-switch-label">{key}</span>
              </label>
            ))}
            <label className="demo-switch">
              <input
                type="checkbox"
                data-testid="toolbar-visible"
                checked={toolbarVisible}
                onChange={() => setToolbarVisible((v) => !v)}
              />
              <span className="demo-switch-track" />
              <span className="demo-switch-label">toolbar</span>
            </label>
          </div>
        </section>

        <section className="demo-section">
          <h2 className="demo-section-title">示例文档</h2>
          <div className="demo-controls">
            {/* e2e 调试入口：math/mermaid 节点只经 remark parse 产生、无 input rule，
                键盘键入 $$/``` 无法构造对应节点，降级用例必须经 setMarkdown 注入 */}
            <button
              className="demo-btn"
              data-testid="doc-bad-math"
              onClick={() => {
                const md = '# T\n\n$\\frac{$\n'
                handleRef.current?.setMarkdown(md)
                setOutput(md)
              }}
            >
              注入非法公式
            </button>
            <button
              className="demo-btn"
              data-testid="doc-bad-mermaid"
              onClick={() => {
                const md = '# T\n\n```mermaid\nINVALID SYNTAX ===\n```\n'
                handleRef.current?.setMarkdown(md)
                setOutput(md)
              }}
            >
              注入非法 mermaid
            </button>
          </div>
        </section>

        <section className="demo-section">
          <div className="demo-output-card">
            <h2 className="demo-output-title">onChange 输出</h2>
            <pre className="demo-output-pre" data-testid="markdown-output">{output}</pre>
          </div>
        </section>
      </main>
    </div>
  )
}
