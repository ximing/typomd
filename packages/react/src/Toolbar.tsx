// Toolbar.tsx
import { useEffect, useReducer, type ReactNode } from 'react'
import { commandRegistry, type CommandSpec, type EditorHandle } from '@mdeditor/core'
import { icons, DEFAULT_ITEMS } from './icons'
import type { ToolbarConfig, ToolbarEntry, ToolbarRenderCtx } from './types'

interface Props {
  handle: EditorHandle
  config?: ToolbarConfig | undefined
  hasUpload: boolean
}

// core 的 isActive 对 feature-gated 命令（math/mermaid）在 feature 未启用时抛
// missingNodeInSchema；core 已冻结，Toolbar 须防御性兜底（spec §6.3：命令注册表含
// 全部命令，toolbar 按 showIn 渲染，不按 feature 过滤）
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
    if (item === 'image' && !hasUpload) continue // spec §6.1：未提供上传钩子时入口隐藏
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
  const children: ReactNode[] = entries.map((entry, i) => {
    if (entry.kind === 'separator') {
      return <span key={`sep-${i}`} className="mdeditor-toolbar-separator" />
    }
    if (entry.kind === 'custom') {
      return <span key={`custom-${i}`}>{entry.render(ctx)}</span>
    }
    const spec = commandRegistry.get(entry.id)!
    return (
      <button
        key={entry.id}
        type="button"
        className="mdeditor-toolbar-button"
        data-command={entry.id}
        data-active={safeActive(spec, handle) || undefined}
        title={spec.label}
        onClick={() => spec.exec(handle)}
      >
        {icons[spec.icon] ?? spec.label}
      </button>
    )
  })

  return <div className="mdeditor-toolbar">{children}</div>
}
