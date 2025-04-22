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
    <div className={dark ? 'mdeditor-dark' : undefined} style={{ maxWidth: 860, margin: '2rem auto' }}>
      <h1>mdeditor demo</h1>
      <fieldset>
        <legend>features</legend>
        {FEATURE_KEYS.map((key) => (
          <label key={key} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              data-testid={`feature-${key}`}
              checked={!!enabled[key]}
              onChange={() => toggleFeature(key)}
            />
            {key}
          </label>
        ))}
        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            data-testid="toolbar-visible"
            checked={toolbarVisible}
            onChange={() => setToolbarVisible((v) => !v)}
          />
          toolbar
        </label>
        <button data-testid="theme-toggle" onClick={() => setDark((v) => !v)}>
          {dark ? '切到亮色' : '切到暗色'}
        </button>
      </fieldset>

      <div data-testid="demo-editor">
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
      </div>

      {/* e2e 调试入口：math/mermaid 节点只经 remark parse 产生、无 input rule，
          键盘键入 $$/``` 无法构造对应节点，降级用例必须经 setMarkdown 注入 */}
      <button
        data-testid="doc-bad-math"
        onClick={() => handleRef.current?.setMarkdown('# T\n\n$\\frac{$\n')}
      >
        注入非法公式
      </button>
      <button
        data-testid="doc-bad-mermaid"
        onClick={() => handleRef.current?.setMarkdown('# T\n\n```mermaid\nINVALID SYNTAX ===\n```\n')}
      >
        注入非法 mermaid
      </button>

      <h2>onChange 输出</h2>
      <pre data-testid="markdown-output">{output}</pre>
    </div>
  )
}
