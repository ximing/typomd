# @typomd/core

Headless Typora-like WYSIWYG Markdown editor (Milkdown / ProseMirror). Markdown is the only source of truth.

Used by [`@typomd/react`](https://www.npmjs.com/package/@typomd/react). Most apps should start there.

```ts
import { createEditor } from '@typomd/core'

const handle = await createEditor({
  root,
  defaultValue: '# Hello',
  features: { math: true, mermaid: true, codeHighlight: true },
  onChange: (markdown) => {},
})
```

**[Docs](https://github.com/ximing/typomd#readme)** · **[Live demo](https://ximing.github.io/typomd/)**

MIT © 2025 ximing
