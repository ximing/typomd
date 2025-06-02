# @typomd/react

React bindings for [typomd](https://github.com/ximing/typomd) — Typora-like WYSIWYG Markdown editor.

**[Live demo](https://ximing.github.io/typomd/)** · **[Docs](https://github.com/ximing/typomd#readme)**

```bash
npm install @typomd/core @typomd/react @typomd/theme
```

```tsx
import { Typomd } from '@typomd/react'
import '@typomd/theme/default.css'
import '@typomd/react/styles.css'

<Typomd defaultValue="# Hello" features={{ math: true, mermaid: true, codeHighlight: true }} />
```

MIT © 2025 ximing
