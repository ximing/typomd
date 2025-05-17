// presets/mermaid/ctx.ts
import { createSlice } from '@milkdown/ctx'
import type { MermaidConfig } from 'mermaid'
import type { EditorError } from '../../types'

export interface MermaidFeatureConfig {
  onError: (e: EditorError) => void
  /** 明/暗双主题（§5.3）；缺省用 §4.2 令牌同步默认值 */
  themes?: { light?: MermaidConfig; dark?: MermaidConfig }
}
export const mermaidFeatureCtx = createSlice<MermaidFeatureConfig>({ onError: () => {} }, 'typomdMermaidFeatureCtx')
