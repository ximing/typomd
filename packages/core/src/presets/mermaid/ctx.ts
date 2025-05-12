// presets/mermaid/ctx.ts
import { createSlice } from '@milkdown/ctx'
import type { EditorError } from '../../types'

export interface MermaidFeatureConfig { onError: (e: EditorError) => void }
export const mermaidFeatureCtx = createSlice<MermaidFeatureConfig>({ onError: () => {} }, 'typomdMermaidFeatureCtx')
