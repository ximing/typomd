import type { ReactNode } from 'react'
import type {
  CreateEditorOptions,
  EditorError,
  EditorHandle,
  FeatureFlags,
} from '@mdeditor/core'

export type { EditorError, EditorHandle, FeatureFlags }

/** §6.2 自定义渲染项的 ctx */
export interface ToolbarRenderCtx {
  handle: EditorHandle
  isActive(commandId: string): boolean
  exec(commandId: string): void
}

/** 工具栏项：内置命令 id / '|' 分隔符 / 自定义渲染 */
export type ToolbarItem = string | ((ctx: ToolbarRenderCtx) => ReactNode)

export interface ToolbarConfig {
  visible?: boolean // 默认 true；false 时完全不渲染（悬浮条/Slash 不受影响）
  items?: ToolbarItem[]
}

export interface MdEditorProps {
  defaultValue?: string
  features?: FeatureFlags
  toolbar?: ToolbarConfig
  placeholder?: string
  readOnly?: boolean
  onChange?: (markdown: string, json: Record<string, unknown>) => void
  onChangeDebounce?: number
  onError?: (error: EditorError) => void
  onUploadImage?: (file: File) => Promise<{ src: string; alt?: string }>
}

/** Task 4 内部使用：toolbar items 归一化后的条目 */
export type ToolbarEntry =
  | { kind: 'separator' }
  | { kind: 'command'; id: string }
  | { kind: 'custom'; render: (ctx: ToolbarRenderCtx) => ReactNode }
