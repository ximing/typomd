// src/index.ts —— @typomd/react-native 桥接协议类型（v1 仅契约，v2 实现）
// 协议与传输层无关：v2 路径 A 跑在 WebView postMessage 上，路径 B 另行评估（见 BRIDGE.md）

/** 编辑器侧配置（宿主 → 编辑器 init 的载荷） */
export interface BridgeConfig {
  features?: {
    math?: boolean
    mermaid?: boolean
    codeHighlight?: boolean
    slash?: boolean
    floatingToolbar?: boolean
  }
  readOnly?: boolean
  placeholder?: string
  theme?: 'light' | 'dark'
}

export interface BridgeError {
  source: string
  cause: unknown
}

export interface SelectionInfo {
  from: number
  to: number
  empty: boolean
}

/** 宿主 → 编辑器（JSON-RPC 子集：单向通知 + exec 请求/响应） */
export type HostToEditorMessage =
  | { type: 'init'; markdown: string; config: BridgeConfig }
  | { type: 'update'; markdown: string } // 对应 EditorHandle.setMarkdown 语义（清 undo、不触发 change）
  | { type: 'exec'; id: number; command: string; args?: unknown } // 对应 execCommand

/** 编辑器 → 宿主 */
export type EditorToHostMessage =
  | { type: 'change'; markdown: string; json: Record<string, unknown> } // 对应 onChange 双格式
  | { type: 'selectionChange'; selection: SelectionInfo }
  | { type: 'error'; error: BridgeError }
  | { type: 'execResult'; id: number; ok: boolean; error?: BridgeError } // exec 的响应
