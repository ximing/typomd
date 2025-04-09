// presets/index.ts
import type { MilkdownPlugin } from '@milkdown/ctx'
import type { CreateEditorOptions, EditorError } from '../types'
import { mathPreset } from './math/index'

export interface FeatureContext {
  onError: (error: EditorError) => void
  onUploadImage?: CreateEditorOptions['onUploadImage']
}

/**
 * feature 开关 → 插件装载器。Task 8/9/11 各自向此表注册 math/mermaid/codeHighlight。
 * 单个 loader 抛错只禁用该 feature（spec §8），由 editor.ts 的 try/catch 保证。
 */
export const featureLoaders: Record<string, (fc: FeatureContext) => MilkdownPlugin[]> = {
  math: (fc) => mathPreset(fc),
}
