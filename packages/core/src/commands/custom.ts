// commands/custom.ts
import { $command } from '@milkdown/utils'
import { setBlockType } from '@milkdown/prose/commands'
import { wrapInList } from '@milkdown/prose/schema-list'
import { codeBlockSchema, headingSchema, listItemSchema } from '@milkdown/preset-commonmark'

/**
 * 已核实：preset-commonmark 内置 wrapInHeadingCommand（$Command<number>）。
 * 这里仍自建 setHeadingCommand，唯一理由是为 execCommand('heading') 提供无参调用时
 * level 默认 1 的语义（react 层 slash/工具栏入口不带 payload）。
 */
export const setHeadingCommand = $command(
  'SetHeading',
  (ctx) => (level: number = 1) => setBlockType(headingSchema.type(ctx), { level }),
)

export const setCodeBlockCommand = $command(
  'SetCodeBlock',
  (ctx) => () => setBlockType(codeBlockSchema.type(ctx)),
)

/**
 * 任务列表：listItem 的 checked attr 由 gfm 以同 id 'list_item' 覆盖扩展，
 * 因此 listItemSchema 从 preset-commonmark 导入即可，.type(ctx) 取到的是 gfm 扩展后的类型
 * （已核实 preset-gfm@7.22.1 无 listItemSchema 导出，其 task list 相关导出为
 * extendListItemSchemaForTask: $NodeSchema<'list_item'>）。
 */
export const turnIntoTaskListCommand = $command(
  'TurnIntoTaskList',
  (ctx) => () => wrapInList(listItemSchema.type(ctx), { checked: false }),
)
