# mdeditor

Typora 式 WYSIWYG markdown 编辑器组件库。

- `@mdeditor/core` — headless 编辑器内核（Milkdown/ProseMirror），markdown 是唯一数据源
- `@mdeditor/react` — `<MdEditor>` 组件、顶部工具栏、悬浮工具栏、Slash 菜单
- `@mdeditor/theme` — CSS variables 设计令牌 + 亮/暗主题（令牌同时导出 JSON）
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

暗色：在任意祖先元素加 `.mdeditor-dark` 类。逐项覆写令牌：CSS 中重定义 `--mdeditor-*` 变量。

## 开发

```bash
pnpm install
pnpm build        # turbo 构建全部包
pnpm test         # 单测（core roundtrip / react 组件）
pnpm typecheck
pnpm e2e          # Playwright（先 pnpm --filter demo exec playwright install chromium）
```
