# @typomd/react-native 桥接协议

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

- **路径 A（默认预期）**：`react-native-webview` 内嵌 `@typomd/core` + 精简 UI，协议跑在 `postMessage` 上，复用率最高
- **路径 B（远期）**：core 的 schema/markdown IO 层平台无关，理论可接原生渲染层；但 Milkdown view 层绑 DOM，真实工作量 v2 再评估

## 令牌映射规则（v2，spec §8）

`@typomd/theme/tokens.json` 语义层即 RN v2 契约：

- **px → dp**：RN 端按数值直读（`space-4: "16px"` → `16`），不做缩放。
- **rgba 字符串**：RN 原生支持，直接传入 StyleSheet 颜色值。
- **阴影刻度**：`shadow-popover` 需拆解映射为 RN shadow 属性——iOS `shadowColor/shadowOffset/shadowOpacity/shadowRadius`（取两段投影中视觉主导的一段），Android `elevation`（建议 8）；精确映射在 v2 实现时标定。
- **亮/暗两组颜色键完全对齐**：RN 侧按主题切换同一组常量，键集合差异会在 theme 构建期直接失败。
- v2 breaking：`color-error` → `color-danger`；`color-quote-border` 删除（引用块并入 `color-text`）；`radius` → `radius-sm/md/lg/full`。

## v3 新增键映射说明（2025-05-20 视觉精修）

tokens.json v3 为增量扩展（无删除键），新增键映射规则不变：px→dp 直读、rgba 直传、shadow-sm/shadow-tooltip 同 shadow-popover 拆解规则。新增颜色键（color-canvas/-heading/-border-subtle/-code-text/-mermaid-node/-mermaid-edge/-skeleton）在 RN v2 实现时按同名语义消费；v3 改值键（dark surface 阶/danger/selection 等）RN 侧重新读值即可，无结构变更。
