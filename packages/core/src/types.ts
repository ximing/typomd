export interface EditorError { source: string; cause: unknown }
export interface SlashTriggerPayload { top: number; left: number; pos: number }
export interface EditorEventMap {
  change: (markdown: string, json: Record<string, unknown>) => void
  selectionChange: (selection: { from: number; to: number; empty: boolean }) => void
  slashTrigger: (payload: SlashTriggerPayload) => void
  error: (error: EditorError) => void
}
export type EditorEvent = keyof EditorEventMap
export interface EditorHandle {
  getMarkdown(): string
  setMarkdown(markdown: string): void
  getJSON(): Record<string, unknown>
  focus(): void
  insert(markdown: string): void
  execCommand(name: string, args?: unknown): void
  setReadOnly(readOnly: boolean): void
  on<E extends EditorEvent>(event: E, cb: EditorEventMap[E]): () => void
  destroy(): void
}
export interface FeatureFlags {
  math?: boolean
  mermaid?: boolean
  codeHighlight?: boolean
  slash?: boolean
  floatingToolbar?: boolean
}
export interface CreateEditorOptions {
  root: HTMLElement
  defaultValue?: string
  features?: FeatureFlags
  onChange?: (markdown: string, json: Record<string, unknown>) => void
  onChangeDebounce?: number
  onError?: (error: EditorError) => void
  onUploadImage?: (file: File) => Promise<{ src: string; alt?: string }>
}
