# @mdeditor/react-native 桥接协议

v1 仅交付契约（本文档 + `src/index.ts` 类型），不实现。协议与传输层无关。

## 消息模型（双向 JSON-RPC 子集）

宿主 → 编辑器：

| 消息 | 载荷 | 对应 core 语义 |
|---|---|---|
| `init` | `{ markdown, config }` | `createEditor({ defaultValue: markdown, ...config })` |
| `update` | `{ markdown }` | `handle.setMarkdown(markdown)`：清 undo、不触发 change、取消 pending debounce |
| `exec` | `{ id, command, args? }` | `handle.execCommand(command, args)`；`id` 用于响应配对 |

编辑器 → 宿主：

| 消息 | 载荷 | 对应 core 语义 |
|---|---|---|
| `change` | `{ markdown, json }` | `onChange(markdown, json)` 双格式，debounce 由编辑器侧完成 |
| `selectionChange` | `{ selection: { from, to, empty } }` | `selectionChange` 事件 |
| `error` | `{ error: { source, cause } }` | `onError` 事件 |
| `execResult` | `{ id, ok, error? }` | `exec` 的响应（ok=false 时带 error） |

约束：
- `exec`/`execResult` 是唯一请求-响应对；其余均为单向通知
- `cause: unknown` 经 JSON 传输时序列化为 `{ message: string, name?: string }`（Error 不可结构化克隆，桥接层负责降级）
- 消息顺序保证由传输层提供（postMessage 天然有序）

## v2 候选路径（记录备查）

- **路径 A（默认预期）**：`react-native-webview` 内嵌 `@mdeditor/core` + 精简 UI，协议跑在 `postMessage` 上，复用率最高
- **路径 B（远期）**：core 的 schema/markdown IO 层平台无关，理论可接原生渲染层；但 Milkdown view 层绑 DOM，真实工作量 v2 再评估
