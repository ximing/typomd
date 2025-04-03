import type { EditorEvent, EditorEventMap } from './types'

export interface Emitter {
  on<E extends EditorEvent>(event: E, cb: EditorEventMap[E]): () => void
  emit<E extends EditorEvent>(event: E, ...args: Parameters<EditorEventMap[E]>): void
  clear(): void
}

export function createEmitter(): Emitter {
  const map = new Map<EditorEvent, Set<(...args: never[]) => void>>()
  return {
    on(event, cb) {
      let set = map.get(event)
      if (!set) { set = new Set(); map.set(event, set) }
      set.add(cb as (...args: never[]) => void)
      return () => { set.delete(cb as (...args: never[]) => void) }
    },
    emit(event, ...args) {
      map.get(event)?.forEach((cb) => (cb as (...a: unknown[]) => void)(...args))
    },
    clear() { map.clear() },
  }
}
