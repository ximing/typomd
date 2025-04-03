// internal.ts — 命令注册表等 core 内部模块用，公共出口不导出
import type { Editor } from '@milkdown/core'
import type { EditorHandle } from './types'

export interface EditorInternal {
  editor: Editor
  readOnlyRef: { current: boolean }
}

export const internalHandles = new WeakMap<EditorHandle, EditorInternal>()
