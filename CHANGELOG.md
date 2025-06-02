# Changelog

## 1.0.0

First public release of typomd — a Typora-like WYSIWYG Markdown editor for React.

### `@typomd/core`

- `createEditor` + `EditorHandle`: `getMarkdown` / `setMarkdown` / `getJSON` / `focus` / `insert` / `execCommand` / `setReadOnly` / `on` / `destroy`
- CommonMark + GFM (tables, task lists, strikethrough)
- Optional presets: KaTeX math, Mermaid (light/dark), Shiki highlighting, image paste/drop
- Shared command registry consumed by toolbar / slash / floating UI
- Markdown is the only source of truth; roundtrip fixtures for commonmark + GFM

### `@typomd/react`

- `<Typomd>` uncontrolled React component
- Top toolbar, floating selection toolbar, slash menu (`/` )
- SVG icons, CSS tooltips, keyboard roving tabindex

### `@typomd/theme`

- CSS variable tokens, light + dark, `auto.css` (system preference)
- Document typography for headings, lists, quotes, code, tables, math, Mermaid
- `tokens.json` export for custom builds / React Native mapping

### `@typomd/react-native`

- Bridge protocol types and `BRIDGE.md` (no runtime in 1.x)
