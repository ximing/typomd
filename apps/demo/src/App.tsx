// src/App.tsx
import { useRef, useState } from 'react'
import { MdEditor, type EditorHandle, type FeatureFlags } from '@mdeditor/react'
import { DEMO_MARKDOWN } from './fixtures'

const FEATURE_KEYS = ['math', 'mermaid', 'codeHighlight', 'slash', 'floatingToolbar'] as const

export function App() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    math: true, mermaid: true, codeHighlight: true, slash: true, floatingToolbar: true,
  })
  const [dark, setDark] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [output, setOutput] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const handleRef = useRef<EditorHandle | null>(null)

  const features: FeatureFlags = Object.fromEntries(FEATURE_KEYS.map((k) => [k, enabled[k]]))

  const toggleFeature = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
    setEditorKey((k) => k + 1) // 非受控语义：demo 通过 key 重建编辑器
  }

  return (
    <div className={`demo-page${dark ? ' mdeditor-dark' : ''}`}>
      <header className="demo-header">
        <div className="demo-brand">
          <h1 className="demo-title">mdeditor</h1>
          <p className="demo-tagline">Milkdown 驱动的 Markdown 编辑器组件库</p>
        </div>
        <nav className="demo-header-actions">
          <a className="demo-link" href="https://github.com/ximing/mdeditor" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <button className="demo-btn" data-testid="theme-toggle" onClick={() => setDark((v) => !v)}>
            {dark ? '切到亮色' : '切到暗色'}
          </button>
        </nav>
      </header>

      <main className="demo-main">
        <section className="demo-editor-card" data-testid="demo-editor">
          <MdEditor
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
              onClick={() => handleRef.current?.setMarkdown('# T\n\n$\\frac{$\n')}
            >
              注入非法公式
            </button>
            <button
              className="demo-btn"
              data-testid="doc-bad-mermaid"
              onClick={() => handleRef.current?.setMarkdown('# T\n\n```mermaid\nINVALID SYNTAX ===\n```\n')}
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
