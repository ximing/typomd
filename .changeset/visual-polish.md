---
"@typomd/theme": minor
"@typomd/core": minor
"@typomd/react": minor
---

视觉精修：精致化明暗双主题（令牌 v3 增量 + 文档排版精修 + mermaid 双主题 + chrome 微调）

- theme：令牌 v3——新增 `color-canvas/-heading/-border-subtle/-code-text/-mermaid-node/-mermaid-edge/-skeleton`、`shadow-sm/shadow-tooltip`、`space-7/10/12/16`、`radius-xl`、`font-size-display`、`font-weight-*`、`line-height-heading/-ui`、`letter-spacing-heading`、`duration-slow`；content.css 排版精修（标题层级/任务列表 flex 对钩/表格 hairline/骨架块/mermaid 容器）
- core：mermaid preset 新增可选 `themes`（明/暗 MermaidConfig），默认双主题渲染 + 缓存键含主题 + 主题切换自动重渲染
- react：chrome 微调（tooltip 阴影/slash 选中态 accent-subtle/滚动条定制）

**Breaking（令牌改值，0.x 走 minor）**：dark `color-bg` #191919→#1a1a1a、`color-bg-secondary` #202020→#242424、`color-bg-elevated` #252525→#2b2b2b、`color-text` 0.81→0.85、`color-text-secondary` 0.46→0.52、`color-text-muted` 0.32→0.42、`color-border*`/`-hover`/`-active`/`-accent-subtle` dark alpha 微调、`color-selection` 0.14/0.16→0.16/0.22、`color-danger` #eb5757→#cf3f3f（亮）/#f07070（暗）、`color-code-bg` #f7f6f3→#f6f5f2（亮）/#202020→#242424（暗）、`color-accent-contrast`（dark 随 color-bg）、`color-focus-ring` dark 0.45→0.50、`shadow-popover` dark 环 0.06→0.08、`--typomd-block-gap` 默认值 6px→0.5em。mermaid 默认渲染外观变为双主题（视觉 breaking 非 API breaking）。

**a11y 偏离（spec §5.1/§5.8 文字色偏离，§8.5 axe 0-violations 底线优先）**：以下两处 spec 原写 `color-text-muted`，实测 `color-text-muted` 对其底色达不到 §7 WCAG 4.5:1，为满足 §8.5「demo 亮/暗扫描 0 violations」改为 `color-text-secondary`（§7 a11y 底线 wins）：

- **R-T11-1（content.css）**：已完成任务列表项文字 `color-text-muted`→`color-text-secondary`（spec §5.1 原注「装饰性弱化是设计意图」用 muted，与 §8.5 0-axe 冲突；a11y 底线优先）。
- **Minor-4（app.css）**：demo 副标题 `.demo-tagline`、`.demo-section-title`、`.demo-output-title` 文字 `color-text-muted`→`color-text-secondary`（同一 §8.5 a11y 理由；属 brief「3 fixes」之外第 4 类 axe 修复）。
