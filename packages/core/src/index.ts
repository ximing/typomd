// index.ts —— @typomd/core 公共出口（API 冻结面，变更需 changeset + BREAKING 标注）
export { createEditor } from './editor'
export { commandRegistry } from './commands/registry'
export type { CommandPlacement, CommandSpec } from './commands/registry'
export type {
  CreateEditorOptions,
  EditorError,
  EditorEvent,
  EditorEventMap,
  EditorHandle,
  FeatureFlags,
  SlashTriggerPayload,
} from './types'
