// presets/math/index.ts
import type { Ctx, MilkdownPlugin } from '@milkdown/ctx'
import { $command } from '@milkdown/utils'
import { mathFeatureCtx } from './ctx'
import { mathBlockSchema, mathInlineSchema, remarkMathPlugin } from './schema'
import { mathBlockView, mathInlineView } from './view'
import type { FeatureContext } from '../index'

/** 插入块级公式（供 Task 12 命令注册表使用） */
export const insertMathBlockCommand = $command('InsertMathBlock', (ctx) => () => (state, dispatch) => {
  const type = mathBlockSchema.type(ctx)
  const node = type.create({ value: '' })
  dispatch?.(state.tr.replaceSelectionWith(node).scrollIntoView())
  return true
})

export function mathPreset(fc: FeatureContext): MilkdownPlugin[] {
  // 将错误处理器注入 mathFeatureCtx 切片。必须用 ctx.inject（创建+赋值）而非 ctx.set：
  // ctx.set 要求切片已存在，否则抛 contextNotFound；ctx.inject 既注册又赋值（与 $ctx 同模式）。
  const setConfig: MilkdownPlugin = (ctx: Ctx) => {
    ctx.inject(mathFeatureCtx, { onError: fc.onError })
    return () => {}
  }
  return [
    setConfig,
    remarkMathPlugin,
    mathInlineSchema,
    mathBlockSchema,
    mathInlineView,
    mathBlockView,
    insertMathBlockCommand,
  ].flat() as MilkdownPlugin[]
}
