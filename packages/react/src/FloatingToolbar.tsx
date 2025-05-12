// FloatingToolbar.tsx
import { useEffect, useMemo, useState } from 'react'
import { commandRegistry, type CommandSpec, type EditorHandle } from '@typomd/core'
import { icons } from './icons'
import { SHORTCUTS } from './command-meta'
import { useFloating, virtualRefFromRect } from './useFloating'

// core 的 isActive 对 feature-gated 命令（math/mermaid）在 feature 未启用时抛
// missingNodeInSchema；core 已冻结，FloatingToolbar 须防御性兜底（与 Toolbar.tsx 同源，
// spec §6.3：命令注册表含全部命令，floating 按 showIn 渲染，不按 feature 过滤）
function safeActive(spec: CommandSpec | undefined, handle: EditorHandle): boolean {
  if (!spec) return false
  try { return spec.isActive(handle) } catch { return false }
}

/** 选区矩形：取 window.getSelection 第一个 range；jsdom 返回 0 矩形，e2e 验证真实定位 */
function currentSelectionRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (range.collapsed) return null
  return range.getBoundingClientRect()
}

export function FloatingToolbar({ handle }: { handle: EditorHandle }) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    return handle.on('selectionChange', (s) => {
      setRect(s.empty ? null : currentSelectionRect())
    })
  }, [handle])

  // useMemo：reference 对象身份必须稳定，否则 useFloating 的 effect 每次渲染都重挂 autoUpdate
  const reference = useMemo(() => (rect ? virtualRefFromRect(rect) : null), [rect])
  const { ref, style } = useFloating(reference, 'top-start')

  if (!rect) return null

  const specs = [...commandRegistry.values()].filter((s) => s.showIn.includes('floating'))

  return (
    <div
      ref={ref}
      className="typomd-floating"
      style={style}
      data-testid="floating-toolbar"
      role="toolbar"
      aria-label="悬浮格式工具栏"
      aria-orientation="horizontal"
    >
      {specs.map((spec) => {
        const active = safeActive(spec, handle)
        return (
          <button
            key={spec.id}
            type="button"
            className="typomd-floating-button"
            data-command={spec.id}
            data-active={active || undefined}
            aria-label={spec.label}
            aria-pressed={active}
            data-tooltip={SHORTCUTS[spec.id] ? `${spec.label} ${SHORTCUTS[spec.id]}` : spec.label}
            onMouseDown={(e) => e.preventDefault() /* 保住选区 */}
            onClick={() => spec.exec(handle)}
          >
            {icons[spec.icon] ?? spec.label}
          </button>
        )
      })}
    </div>
  )
}
