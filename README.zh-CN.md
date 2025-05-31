# typomd

[English](./README.md) · [简体中文](./README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/@typomd/react.svg)](https://www.npmjs.com/package/@typomd/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![demo](https://img.shields.io/badge/demo-live-2383e2.svg)](https://ximing.github.io/typomd/)

面向 React 的 **Typora 式 WYSIWYG Markdown 编辑器**。输入 Markdown，直接看到排版结果。文档的唯一数据源始终是 Markdown，不依赖私有 JSON。

**[在线演示 →](https://ximing.github.io/typomd/)**

![typomd 亮色主题](docs/images/editor-light.png)

![typomd 暗色主题](docs/images/editor-dark.png)

## 能力

- **所见即所得 Markdown** — 标题、列表、引用、表格、任务列表、GFM 删除线
- **Slash 菜单** — 输入 `/` 插入块（标题、列表、代码、公式、Mermaid…）
- **悬浮工具栏** — 选中文字即可加粗 / 斜体 / 链接 / 列表
- **公式** — KaTeX 行内 `$...$` 与块级 `$$...$$`
- **图表** — Mermaid 代码块，跟随亮/暗主题
- **代码高亮** — Shiki，语言按需加载
- **图片** — 粘贴或拖拽，上传逻辑由你提供
- **主题** — 亮色、暗色、跟随系统；可用 CSS 变量逐项覆写
- **无障碍** — 键盘操作工具栏、焦点环、`prefers-reduced-motion`

<p>
  <img src="docs/images/slash.png" alt="Slash 命令菜单" width="360" />
  <img src="docs/images/floating.png" alt="悬浮选择工具栏" width="360" />
</p>

## 安装

```bash
npm install @typomd/core @typomd/react @typomd/theme
```

Peer：React 18.3+ 或 19。

## 快速开始

```tsx
import { useRef } from 'react'
import { Typomd, type EditorHandle } from '@typomd/react'
import '@typomd/theme/default.css'
import '@typomd/react/styles.css'

export function App() {
  const editorRef = useRef<EditorHandle>(null)

  return (
    <Typomd
      ref={editorRef}
      defaultValue="# 你好 typomd"
      placeholder="输入 / 唤起命令…"
      features={{
        math: true,
        mermaid: true,
        codeHighlight: true,
        slash: true,
        floatingToolbar: true,
      }}
      toolbar={{ visible: true }}
      onChange={(markdown) => console.log(markdown)}
      onUploadImage={async (file) => {
        // 自行上传后返回公网 URL
        return { src: URL.createObjectURL(file), alt: file.name }
      }}
    />
  )
}
```

读写文档：

```ts
editorRef.current?.getMarkdown()
editorRef.current?.setMarkdown('# 替换\n')
editorRef.current?.insert('**加粗**')
editorRef.current?.execCommand('bold')
editorRef.current?.focus()
```

## 使用说明

### 工具栏、Slash、选区条

| 操作 | 方式 |
| --- | --- |
| 设置当前行格式 | 点顶部工具栏，或输入 `/` 选命令 |
| 设置选中文字 | 选中后出现悬浮条 |
| 插入公式 / Mermaid / 表格 / 图片 | `/`，在 **媒体** 分组里选 |
| 撤销 / 重做 | 工具栏或 `⌘Z` / `⌘⇧Z` |

Slash 菜单和两条工具栏共用同一套命令注册表，文案保持一致。

### 可直接键入的 Markdown

| 输入 | 效果 |
| --- | --- |
| `# 标题` | 标题 |
| `- item` / `1. item` / `- [ ] 任务` | 列表 |
| `> 引用` | 引用块 |
| `**加粗**` `*斜体*` `~~删除线~~` `` `代码` `` | 行内标记 |
| `$E=mc^2$` / `$$...$$` | KaTeX |
| ` ```ts ` / ` ```mermaid ` | 高亮代码 / 图表 |

只持久化 Markdown。`onChange` 给出规范化字符串（以及一份 ProseMirror JSON 快照，按需使用）。

### 快捷键

| 快捷键 | 命令 |
| --- | --- |
| `⌘B` | 加粗 |
| `⌘I` | 斜体 |
| `⌘E` | 行内代码 |
| `⌘⌥X` | 删除线 |
| `⌘⇧B` | 引用 |
| `⌘⌥C` | 代码块 |
| `⌘⌥8` / `⌘⌥7` | 无序 / 有序列表 |
| `/` | Slash 菜单 |
| `Esc` | 关闭菜单并回焦 |

Windows / Linux 下 `⌘` 为 `Ctrl`。

## 主题

三套 CSS 入口：

| 引入 | 行为 |
| --- | --- |
| `@typomd/theme/default.css` | 默认亮色；在任意祖先（一般是 `<html>`）加 `.typomd-dark` 切暗色 |
| `@typomd/theme/auto.css` | 跟随 `prefers-color-scheme` |
| `@typomd/theme/tokens.json` | 令牌表，给自定义构建 / React Native 映射 |

覆写令牌：

```css
:root {
  --typomd-color-accent: #0f766e;
  --typomd-radius-md: 8px;
}
```

### 暗色防闪烁

如果用 JS 在首帧之后才加 `.typomd-dark`，会闪一下亮色。把这段放进 `<head>`：

```html
<script>
  ;(function () {
    try {
      var t = localStorage.getItem('your-theme-key')
      if (t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('typomd-dark')
      }
    } catch (e) {}
  })()
</script>
```

## API

### `<Typomd>`

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `defaultValue` | `string` | `''` | 非受控初始 Markdown |
| `placeholder` | `string` | | 空文档占位 |
| `readOnly` | `boolean` | `false` | |
| `features.math` | `boolean` | `true` | KaTeX |
| `features.mermaid` | `boolean` | `true` | Mermaid |
| `features.codeHighlight` | `boolean` | `true` | Shiki |
| `features.slash` | `boolean` | `true` | `/` 菜单 |
| `features.floatingToolbar` | `boolean` | `true` | 选区悬浮条 |
| `toolbar.visible` | `boolean` | `true` | 只隐藏顶栏 |
| `toolbar.items` | `(string \| render)[]` | 内置 | 命令 id、`'\|'` 分隔符、或自定义渲染 |
| `onChange` | `(md, json) => void` | | 防抖后的 Markdown + JSON |
| `onChangeDebounce` | `number` | | 毫秒 |
| `onError` | `(err) => void` | | 预设失败（非法公式等） |
| `onUploadImage` | `(file) => Promise<{src, alt?}>` | | 图片插入 / 粘贴 / 拖拽需要 |
| `ref` | `EditorHandle` | | 命令式 API |

### `EditorHandle`

```ts
getMarkdown(): string
setMarkdown(markdown: string): void  // 不触发 onChange；清空 undo
getJSON(): Record<string, unknown>
focus(): void
insert(markdown: string): void
execCommand(name: string, args?: unknown): void
setReadOnly(readOnly: boolean): void
on(event, cb): () => void            // 'change' | 'selectionChange' | 'slashTrigger' | 'error'
destroy(): void
```

`setMarkdown` 整篇替换、丢掉未触发的 `onChange`、重置 undo —— 用来加载文件，不要用来模拟按键。

### 无 UI 内核

不需要 React 外壳时用 `@typomd/core`：

```ts
import { createEditor } from '@typomd/core'

const handle = await createEditor({
  root: document.getElementById('host')!,
  defaultValue: '# Hi',
  onChange: (md) => {},
})
```

## 包

| 包 | 内容 |
| --- | --- |
| [`@typomd/react`](https://www.npmjs.com/package/@typomd/react) | `<Typomd>`、顶栏、悬浮条、Slash 菜单 |
| [`@typomd/core`](https://www.npmjs.com/package/@typomd/core) | 无头编辑器 + 命令注册表 |
| [`@typomd/theme`](https://www.npmjs.com/package/@typomd/theme) | CSS 变量、亮/暗、`tokens.json` |
| [`@typomd/react-native`](https://www.npmjs.com/package/@typomd/react-native) | 1.x 仅桥接**类型**（见 `BRIDGE.md`） |

## 本地开发

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm --filter demo dev    # http://localhost:5173
pnpm e2e
```

需要 Node 18+、pnpm 9.5+。

## 许可证

[MIT](./LICENSE) © 2025 ximing
