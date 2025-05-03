// Toolbar.tsx
import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { commandRegistry, type CommandSpec, type EditorHandle } from '@mdeditor/core'
import { icons, DEFAULT_ITEMS } from './icons'
import { SHORTCUTS } from './command-meta'
import type { ToolbarConfig, ToolbarEntry, ToolbarRenderCtx } from './types'

interface Props {
  handle: EditorHandle
  config?: ToolbarConfig | undefined
  hasUpload: boolean
}

// core 的 isActive 对 feature-gated 命令（math/mermaid）在 feature 未启用时抛
// missingNodeInSchema；core 已冻结，Toolbar 须防御性兜底（前序 spec §6.3：命令注册表
// 含全部命令，toolbar 按 showIn 渲染，不按 feature 过滤）
function safeActive(spec: CommandSpec | undefined, handle: EditorHandle): boolean {
  if (!spec) return false
  try { return spec.isActive(handle) } catch { return false }
}

function normalize(config: ToolbarConfig | undefined, hasUpload: boolean): ToolbarEntry[] {
  const items = config?.items ?? DEFAULT_ITEMS
  const entries: ToolbarEntry[] = []
  for (const item of items) {
    if (typeof item === 'function') {
      entries.push({ kind: 'custom', render: item })
      continue
    }
    if (item === '|') {
      entries.push({ kind: 'separator' })
      continue
    }
    const spec = commandRegistry.get(item)
    if (!spec || !spec.showIn.includes('toolbar')) {
      console.warn(`[mdeditor] 工具栏项 "${item}" 不是已注册的工具栏命令，已跳过`)
      continue
    }
    if (item === 'image' && !hasUpload) continue // 前序 spec §6.1：未提供上传钩子时入口隐藏
    entries.push({ kind: 'command', id: item })
  }
  return entries
}

export function Toolbar({ handle, config, hasUpload }: Props) {
  if (config?.visible === false) return null

  return <ToolbarInner handle={handle} config={config} hasUpload={hasUpload} />
}

function ToolbarInner({ handle, config, hasUpload }: Props) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const [focusIdx, setFocusIdx] = useState(0)
  const btnRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    const off1 = handle.on('selectionChange', force)
    const off2 = handle.on('change', force)
    return () => { off1(); off2() }
  }, [handle])

  const ctx: ToolbarRenderCtx = {
    handle,
    isActive: (commandId) => safeActive(commandRegistry.get(commandId), handle),
    exec: (commandId) => commandRegistry.get(commandId)?.exec(handle),
  }

  const entries = normalize(config, hasUpload)
  const commandIds = entries.filter((e) => e.kind === 'command').map((e) => (e as { kind: 'command'; id: string }).id)

  // roving tabindex（§5.3）：仅内置按钮参与；custom 渲染项是任意 ReactNode，焦点行为由使用方自理
  const moveFocus = (next: number) => {
    const n = commandIds.length
    if (n === 0) return
    const idx = ((next % n) + n) % n
    setFocusIdx(idx)
    btnRefs.current.get(commandIds[idx]!)?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = commandIds.findIndex((id) => btnRefs.current.get(id) === document.activeElement)
    const base = cur >= 0 ? cur : focusIdx
    if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(base + 1); return }
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(base - 1); return }
    if (e.key === 'Home') { e.preventDefault(); moveFocus(0); return }
    if (e.key === 'End') { e.preventDefault(); moveFocus(commandIds.length - 1); return }
    if (e.key === 'Escape') { e.preventDefault(); handle.focus() } // §5.3：Esc 焦点回编辑器
  }

  const children: ReactNode[] = entries.map((entry, i) => {
    if (entry.kind === 'separator') {
      return <span key={`sep-${i}`} className="mdeditor-toolbar-separator" />
    }
    if (entry.kind === 'custom') {
      return <span key={`custom-${i}`}>{entry.render(ctx)}</span>
    }
    const spec = commandRegistry.get(entry.id)!
    const active = safeActive(spec, handle)
    const tooltip = SHORTCUTS[entry.id] ? `${spec.label} ${SHORTCUTS[entry.id]}` : spec.label
    return (
      <button
        key={entry.id}
        type="button"
        ref={(el) => {
          if (el) btnRefs.current.set(entry.id, el)
          else btnRefs.current.delete(entry.id)
        }}
        className="mdeditor-toolbar-button"
        data-command={entry.id}
        data-active={active || undefined}
        aria-label={spec.label}
        aria-pressed={active}
        data-tooltip={tooltip}
        tabIndex={commandIds.indexOf(entry.id) === focusIdx ? 0 : -1}
        onMouseDown={(e) => e.preventDefault() /* 鼠标点击不夺编辑器焦点（§5.3） */}
        onClick={() => { spec.exec(handle); handle.focus() /* 点击后焦点回编辑器（§5.3） */ }}
      >
        {icons[spec.icon] ?? spec.label}
      </button>
    )
  })

  return (
    <div
      className="mdeditor-toolbar"
      role="toolbar"
      aria-label="格式工具栏"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}
