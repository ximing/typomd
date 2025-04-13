// index.ts
export { createEditor } from './editor'
export type {
  CreateEditorOptions,
  EditorError,
  EditorEvent,
  EditorEventMap,
  EditorHandle,
  FeatureFlags,
  SlashTriggerPayload,
} from './types'
export { commandRegistry } from './commands/registry'
export type { CommandPlacement, CommandSpec } from './commands/registry'
