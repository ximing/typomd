// presets/mermaid/index.ts
import type { Ctx, MilkdownPlugin } from '@milkdown/ctx'
import { $command } from '@milkdown/utils'
import { mermaidFeatureCtx } from './ctx'
import { mermaidSchema, remarkMermaidPlugin } from './schema'
import { mermaidView } from './view'
import type { FeatureContext } from '../index'

/** 插入 mermaid 图表（供 Task 12 命令注册表使用） */
export const insertMermaidCommand = $command('InsertMermaid', (ctx) => () => (state, dispatch) => {
  const type = mermaidSchema.type(ctx)
  const node = type.create({ value: 'graph TD\n    A-->B' })
  dispatch?.(state.tr.replaceSelectionWith(node).scrollIntoView())
  return true
})

export function mermaidPreset(fc: FeatureContext): MilkdownPlugin[] {
  // 将错误处理器注入 mermaidFeatureCtx 切片。必须用 ctx.inject（创建+赋值）而非 ctx.set：
  // ctx.set 要求切片已存在，否则抛 contextNotFound；ctx.inject 既注册又赋值（与 $ctx 同模式）。
  const setConfig: MilkdownPlugin = (ctx: Ctx) => {
    ctx.inject(mermaidFeatureCtx, { onError: fc.onError })
    return () => {}
  }
  // 用整体元组（mermaidSchema / remarkMermaidPlugin）而非 .node 子属性：
  // $nodeSchema / $remark 返回 [schemaCtx, nodeSchema] 元组，.node 会丢掉 schemaCtx 半段
  // 导致注入 schema 工厂的切片缺失 → Context "mermaid" not found。.flat() 展开元组。
  return [setConfig, remarkMermaidPlugin, mermaidSchema, mermaidView, insertMermaidCommand].flat() as MilkdownPlugin[]
}
