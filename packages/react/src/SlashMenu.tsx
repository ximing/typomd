// SlashMenu.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  commandRegistry,
  type EditorHandle,
  type SlashTriggerPayload,
} from '@mdeditor/core'
import { icons } from './icons'
import { SHORTCUTS, SLASH_GROUPS, SLASH_GROUP_ORDER } from './command-meta'
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
  const menuEl = useRef<HTMLDivElement | null>(null)

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

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof items>()
    for (const spec of items) {
      const g = SLASH_GROUPS[spec.id] ?? '其他' // §5.5：未入表命令归入默认分组
      if (!groups.has(g)) groups.set(g, [])
      groups.get(g)!.push(spec)
    }
    return SLASH_GROUP_ORDER.filter((g) => groups.has(g)).map((g) => [g, groups.get(g)!] as const)
  }, [items])
  // 键盘/高亮索引必须与分组后的 DOM 顺序一致，否则 ArrowDown 会跳组
  const flat = useMemo(() => grouped.flatMap(([, specs]) => specs), [grouped])

  // useMemo：reference 对象身份必须稳定（open 期间坐标不变）
  const reference = useMemo(
    () => (open ? virtualRefFromPoint(open.payload.top, open.payload.left) : null),
    [open],
  )
  const { ref, style } = useFloating(reference, 'bottom')
  const setRefs = (el: HTMLDivElement | null) => {
    menuEl.current = el
    ref(el)
  }

  // 键盘导航：菜单打开期间从编辑器根捕获
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(null); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        const spec = flat[active]
        if (spec) execAndClose(spec.id)
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, active])

  // aria-activedescendant（§5.5）：焦点始终在编辑器内，用 aria 指向高亮项；
  // 取编辑器元素限定在自身 .mdeditor-root 内，多实例共存不会取错
  useEffect(() => {
    if (!open) return
    const root = menuEl.current?.closest('.mdeditor-root')
    const pm = root?.querySelector('.ProseMirror') as HTMLElement | null
    if (!pm) return
    const current = flat[active]
    if (current) pm.setAttribute('aria-activedescendant', `mdeditor-slash-opt-${current.id}`)
    return () => { pm.removeAttribute('aria-activedescendant') }
  }, [open, active, flat])

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
    <div ref={setRefs} className="mdeditor-slash" style={style} data-testid="slash-menu" role="listbox" aria-label="插入命令">
      {items.length === 0 && <div className="mdeditor-slash-item" aria-disabled="true">无匹配命令</div>}
      {grouped.map(([group, specs]) => (
        <div key={group} role="group" aria-label={group}>
          <div className="mdeditor-slash-group">{group}</div>
          {specs.map((spec) => {
            const i = flat.indexOf(spec)
            return (
              <div
                key={spec.id}
                id={`mdeditor-slash-opt-${spec.id}`}
                role="option"
                aria-selected={i === active}
                data-selected={i === active || undefined}
                data-command={spec.id}
                className="mdeditor-slash-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execAndClose(spec.id)}
              >
                <span className="mdeditor-slash-item-icon">{icons[spec.icon] ?? ''}</span>
                <span className="mdeditor-slash-item-label">{spec.label}</span>
                {SHORTCUTS[spec.id] && <kbd className="mdeditor-slash-item-kbd">{SHORTCUTS[spec.id]}</kbd>}
              </div>
            )
          })}
        </div>
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
