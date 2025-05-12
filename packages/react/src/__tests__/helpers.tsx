// __tests__/helpers.tsx
import { render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { expect } from 'vitest'
import type { EditorHandle } from '@typomd/core'
import { Typomd } from '../Typomd'
import type { TypomdProps } from '../types'

/**
 * 渲染 <Typomd> 并等待 core 编辑器就绪（data-ready 标记由 TypomdInner 挂载成功后设置）。
 * 返回冻结的 EditorHandle（ref callback 捕获）。
 */
export async function renderTypomd(
  props: Partial<TypomdProps> = {},
): Promise<{ handle: EditorHandle; root: HTMLElement } & RenderResult> {
  let handle: EditorHandle | undefined
  const result = render(
    <Typomd
      ref={(h) => { handle = h ?? undefined }}
      onChangeDebounce={0}
      {...props}
    />,
  )
  await waitFor(() => {
    expect(screen.getByTestId('typomd').getAttribute('data-ready')).toBe('true')
  })
  if (!handle) throw new Error('Typomd ref 未在就绪时提供 handle')
  // root 必须是 .typomd-root：Toolbar 渲染在其内、.typomd-body 之前，
  // 返回宿主 div（data-testid=typomd）会导致 toolbar 相关 querySelector 恒 null
  const root = result.container.querySelector('.typomd-root') as HTMLElement
  if (!root) throw new Error('.typomd-root 未渲染')
  return { handle, root, ...result }
}
