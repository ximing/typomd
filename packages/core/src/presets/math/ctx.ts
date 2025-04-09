// presets/math/ctx.ts
import { createSlice } from '@milkdown/ctx'
import type { EditorError } from '../../types'

export interface MathFeatureConfig { onError: (e: EditorError) => void }
export const mathFeatureCtx = createSlice<MathFeatureConfig>({ onError: () => {} }, 'mdeditorMathFeatureCtx')
