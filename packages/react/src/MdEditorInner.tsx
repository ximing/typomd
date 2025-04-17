// MdEditorInner.tsx
import { useLayoutEffect, useRef, useState } from 'react'
import { createEditor, type CreateEditorOptions, type EditorHandle } from '@mdeditor/core'

interface Props {
  options: Omit<CreateEditorOptions, 'root'>
  placeholder?: string | undefined
  onReady: (handle: EditorHandle) => void
}

/**
 * 直接挂载 core createEditor 的宿主组件。
 * 为什么不用 @milkdown/react：它的 useEditor 接收 Editor.make() 工厂，
 * 与 core 的 createEditor(root) → Promise<EditorHandle> 模型不兼容（见 Global Constraints）。
 */
export function MdEditorInner({ options, placeholder, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    let handle: EditorHandle | undefined

    void createEditor({ root: host, ...options }).then((h) => {
      if (cancelled) { h.destroy(); return }
      handle = h
      // placeholder 挂在 .ProseMirror 元素上而非宿主 div：
      // CSS ::before 的 content: attr() 只能读伪元素所在元素自身的属性
      if (placeholder !== undefined) {
        host.querySelector('.ProseMirror')?.setAttribute('data-placeholder', placeholder)
      }
      setReady(true)
      onReady(h)
    })

    return () => {
      cancelled = true
      handle?.destroy()
      setReady(false)
    }
    // 非受控语义（spec §6.1）：只在挂载时创建一次；options/placeholder 引用变化不重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={hostRef}
      data-testid="mdeditor"
      data-ready={ready ? 'true' : undefined}
    />
  )
}
