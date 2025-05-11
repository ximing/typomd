# mdeditor

Typora 式 WYSIWYG markdown 编辑器组件库。

- `@mdeditor/core` — headless 编辑器内核（Milkdown/ProseMirror），markdown 是唯一数据源
- `@mdeditor/react` — `<MdEditor>` 组件、顶部工具栏、悬浮工具栏、Slash 菜单
- `@mdeditor/theme` — CSS variables 设计令牌 + 亮/暗主题（令牌同时导出 JSON，含 `auto.css` 跟随系统主题）
- `@mdeditor/react-native` — v1 仅桥接协议契约（见 BRIDGE.md），v2 实现

## 安装

```bash
npm install @mdeditor/core @mdeditor/react @mdeditor/theme
```

## 用法

```tsx
import { MdEditor } from '@mdeditor/react'
import '@mdeditor/theme/default.css'
import '@mdeditor/react/styles.css'

<MdEditor
  defaultValue="# Hello"
  features={{ math: true, mermaid: true, codeHighlight: true, slash: true, floatingToolbar: true }}
  toolbar={{ visible: true }}
  onChange={(markdown, json) => {}}
  onUploadImage={async (file) => ({ src: '...' })}
  ref={editorRef} // EditorHandle: getMarkdown/setMarkdown/getJSON/focus/insert/execCommand/setReadOnly/on/destroy
/>
```

## 主题

三套入口（暗色默认只覆写颜色类令牌）：

- `@mdeditor/theme/default.css` — 默认：亮色为基，暗色经 `.mdeditor-dark` 类切换（在任意祖先元素加类）
- `@mdeditor/theme/auto.css` — 跟随系统 `prefers-color-scheme`
- `@mdeditor/theme/tokens.json` — 令牌 JSON（自定义构建 / RN 映射用）

逐项覆写令牌：CSS 中重定义 `--mdeditor-*` 变量即可。

### 令牌速览

- 颜色：`color-bg / -bg-secondary / -bg-elevated / -text / -text-secondary / -text-muted / -border / -border-strong / -hover / -active / -accent / -accent-contrast / -accent-subtle / -focus-ring / -selection / -danger / -code-bg`（前缀均为 `--mdeditor-`）
- 尺寸：`space-0_5…8`、`radius-sm/md/lg/full`
- 字体：`font-text / font-mono / font-size / font-size-ui / font-size-ui-sm / line-height`
- 动效：`duration-fast(100ms) / duration-base(160ms)`、`ease-standard / ease-out`
- 层级：`z-sticky(10) / z-floating(20) / z-slash(30) / z-tooltip(40)`
- 阴影：`shadow-popover`

### v0.1 → v0.2 令牌迁移对照（§10）

| 旧令牌（已删除） | 新令牌 |
| --- | --- |
| `--mdeditor-radius` | `--mdeditor-radius-md`（另有 `-sm/-lg/-full`） |
| `--mdeditor-color-error` | `--mdeditor-color-danger` |
| `--mdeditor-color-quote-border` | 删除——引用块左边框并入 `--mdeditor-color-text` |
| `--mdeditor-color-accent-subtle` | 保留键名，语义调整为「激活态底」 |

新增：`color-bg-secondary / -bg-elevated / -text-secondary / -border-strong / -hover / -active / -accent-contrast / -focus-ring / -code-bg`、`space-0_5/1_5/5/8`、`radius-sm/lg/full`、`font-size-ui / -ui-sm`、`duration-* / ease-*`、`z-*`、`shadow-popover`。

## 开发

```bash
pnpm install
pnpm build        # turbo 构建全部包
pnpm test         # 单测（core roundtrip / react 组件）
pnpm typecheck
pnpm e2e          # Playwright（先 pnpm --filter demo exec playwright install chromium）
```
