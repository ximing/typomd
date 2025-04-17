// __tests__/helpers.tsx
import { render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { expect } from 'vitest'
import type { EditorHandle } from '@mdeditor/core'
import { MdEditor } from '../MdEditor'
import type { MdEditorProps } from '../types'

/**
 * 渲染 <MdEditor> 并等待 core 编辑器就绪（data-ready 标记由 MdEditorInner 挂载成功后设置）。
 * 返回冻结的 EditorHandle（ref callback 捕获）。
 */
export async function renderMdEditor(
  props: Partial<MdEditorProps> = {},
): Promise<{ handle: EditorHandle; root: HTMLElement } & RenderResult> {
  let handle: EditorHandle | undefined
  const result = render(
    <MdEditor
      ref={(h) => { handle = h ?? undefined }}
      onChangeDebounce={0}
      {...props}
    />,
  )
  await waitFor(() => {
    expect(screen.getByTestId('mdeditor').getAttribute('data-ready')).toBe('true')
  })
  if (!handle) throw new Error('MdEditor ref 未在就绪时提供 handle')
  // root 必须是 .mdeditor-root：Toolbar 渲染在其内、.mdeditor-body 之前，
  // 返回宿主 div（data-testid=mdeditor）会导致 toolbar 相关 querySelector 恒 null
  const root = result.container.querySelector('.mdeditor-root') as HTMLElement
  if (!root) throw new Error('.mdeditor-root 未渲染')
  return { handle, root, ...result }
}
