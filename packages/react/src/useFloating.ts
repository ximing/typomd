// useFloating.ts
import { useEffect, useState, type CSSProperties } from 'react'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'

export interface VirtualRef {
  getBoundingClientRect: () => {
    x: number; y: number; top: number; left: number; right: number; bottom: number; width: number; height: number
  }
}

/** 由坐标构造 virtual element（slashTrigger 的 {top,left} 用） */
export function virtualRefFromPoint(top: number, left: number): VirtualRef {
  return {
    getBoundingClientRect: () => ({
      x: left, y: top, top, left, right: left, bottom: top, width: 0, height: 0,
    }),
  }
}

/** 由 DOM Range 构造 reference（悬浮工具栏用，取选区矩形） */
export function virtualRefFromRect(rect: DOMRect): VirtualRef {
  return { getBoundingClientRect: () => rect }
}

export function useFloating(
  reference: VirtualRef | null,
  placement: 'top' | 'bottom' | 'top-start' | 'bottom-start' = 'top',
) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0 })

  useEffect(() => {
    if (!reference || !el) return
    let gen = 0
    const update = () => {
      void document.body.offsetHeight
      const g = ++gen
      void computePosition(reference as never, el, {
        placement,
        strategy: 'fixed',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (g !== gen) return
        setStyle({ position: 'fixed', top: y, left: x })
      })
    }
    update()
    // 0ms：当前栈结束后；32ms：setMarkdown 折叠大文档后的布局再算一帧
    const t0 = setTimeout(update, 0)
    const t1 = setTimeout(update, 32)
    const stop = autoUpdate(reference as never, el, update)
    return () => {
      gen++
      clearTimeout(t0)
      clearTimeout(t1)
      stop()
    }
  }, [reference, el, placement])

  return { ref: setEl, style }
}
