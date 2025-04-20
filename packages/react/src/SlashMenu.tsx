// SlashMenu.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  commandRegistry,
  type EditorHandle,
  type SlashTriggerPayload,
} from '@mdeditor/core'
import { icons } from './icons'
import { slashQueryFromDiff } from './slash-query'
import { useFloating, virtualRefFromPoint } from './useFloating'

interface Props {
  handle: EditorHandle
  hasUpload: boolean
}

interface OpenState {
  payload: SlashTriggerPayload
  baseMarkdown: string
}

export function SlashMenu({ handle, hasUpload }: Props) {
  const [open, setOpen] = useState<OpenState | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // 打开/关闭：slashTrigger 打开；change 更新查询词（查询词非法或 '/' 被删 → 关闭）
  useEffect(() => {
    const offTrigger = handle.on('slashTrigger', (payload) => {
      setOpen({ payload, baseMarkdown: handle.getMarkdown() })
      setQuery('')
      setActive(0)
    })
    return offTrigger
  }, [handle])

  useEffect(() => {
    if (!open) return
    return handle.on('change', (md) => {
      const q = slashQueryFromDiff(open.baseMarkdown, md)
      if (q === null) { setOpen(null); return }
      setQuery(q)
      setActive(0)
    })
  }, [handle, open])

  const items = useMemo(() => {
    const all = [...commandRegistry.values()].filter(
      (s) => s.showIn.includes('slash') && (hasUpload || s.id !== 'image'),
    )
    const q = query.toLowerCase()
    return q ? all.filter((s) => s.id.toLowerCase().includes(q) || s.label.includes(query)) : all
  }, [query, hasUpload])

  // useMemo：reference 对象身份必须稳定（open 期间坐标不变）
  const reference = useMemo(
    () => (open ? virtualRefFromPoint(open.payload.top, open.payload.left) : null),
    [open],
  )
  const { ref, style } = useFloating(reference, 'bottom')

  // 键盘导航：菜单打开期间从编辑器根捕获
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(null); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        const spec = items[active]
        if (spec) execAndClose(spec.id)
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, active])

  if (!open) return null

  const execAndClose = (id: string) => {
    // 删除 '/query' 残留文本：全文差分逆操作（setMarkdown 清 undo 是 spec §6.1 既有语义，
    // Slash 块插入场景接受此代价）
    const cleaned = removeSlashToken(open.baseMarkdown, handle.getMarkdown())
    handle.setMarkdown(cleaned)
    handle.execCommand(id)
    setOpen(null)
  }

  return (
    <div ref={ref} className="mdeditor-slash" style={style} data-testid="slash-menu" role="listbox">
      {items.length === 0 && <div className="mdeditor-slash-item" aria-disabled>无匹配命令</div>}
      {items.map((spec, i) => (
        <button
          key={spec.id}
          type="button"
          role="option"
          aria-selected={i === active}
          data-selected={i === active || undefined}
          data-command={spec.id}
          className="mdeditor-slash-item"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execAndClose(spec.id)}
        >
          <span>{icons[spec.icon] ?? ''}</span>
          <span>{spec.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * 去掉 '/query'：菜单打开时快照 base 已含 '/'；curr = base 前缀 + 查询词。
 * 最长公共前缀点 i 处即 '/' 之后的位置；'/' 位于 i-1。
 * 删除 curr 中 [i-1, i-1 + 1 + queryLen) 的片段即恢复输入 '/' 之前的文档。
 * （前提：菜单打开期间光标未移动——打开期间所有编辑都追加查询词，成立。）
 *
 * 必须 trimEnd（与 slashQueryFromDiff 同理）：getMarkdown 尾部 '\n' 不 trim 时，
 * 未键入查询词直接选命令的场景下 queryLen 计算包含 '\n'，删除窗口错位留下 '/' 残留。
 */
function removeSlashToken(base: string, curr: string): string {
  const b = base.trimEnd()
  const c = curr.trimEnd()
  let i = 0
  while (i < b.length && i < c.length && b[i] === c[i]) i++
  const queryLen = c.length - i
  return c.slice(0, i - 1) + c.slice(i + queryLen)
}
