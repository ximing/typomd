---
"@mdeditor/theme": minor
"@mdeditor/react": minor
---

UI 重构（方案 A：令牌分层 + 原生 CSS 全面重写）

- theme：令牌体系 v2（语义颜色/尺寸/动效/层级/阴影令牌），新增 `auto.css`（跟随系统主题）；content.css 全量文档排版（Notion 风）
- react：chrome 全面重写——SVG 图标、Toolbar（aria-label/纯 CSS tooltip/aria-pressed/roving tabindex/Esc 与点击回焦）、FloatingToolbar（shadow 环浮层 + 160ms 进场）、SlashMenu（瓷贴 + 分组 + aria-activedescendant）
- a11y：box-shadow 焦点环、reduced-motion 兜底、WCAG 对比度测试

**Breaking（令牌改名/删除）**：`--mdeditor-radius` → `--mdeditor-radius-md`；`--mdeditor-color-error` → `--mdeditor-color-danger`；`--mdeditor-color-quote-border` 删除（引用块并入 `--mdeditor-color-text`）；`--mdeditor-color-accent-subtle` 语义调整为激活态底。
