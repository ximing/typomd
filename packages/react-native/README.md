# @typomd/react-native

Bridge **protocol types** for embedding [typomd](https://github.com/ximing/typomd) in React Native.

1.x ships the contract only (`BRIDGE.md` + TypeScript types). There is no runtime editor yet — that is planned for 2.x.

```ts
import type { HostToEditorMessage, EditorToHostMessage } from '@typomd/react-native'
```

See [BRIDGE.md](./BRIDGE.md) for the message map and token mapping rules.

MIT © 2025 ximing
