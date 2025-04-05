// __tests__/fixed-point.test.ts
import { describe, expect, test } from 'vitest'
import { createTestEditor } from './helpers'

/** 非 canonical 输入：同一语义的不同 markdown 写法 */
const perturbed: string[] = [
  '* a\n* b\n',                       // * 子弹 → 规范化为 -
  '+ a\n+ b\n',                       // + 子弹 → 规范化为 -
  '__bold__ and _italic_\n',          // 下划线强调 → 规范化为 */**
  'Setext H1\n===\n',                 // setext → 规范化为 ATX
  '## closed ##\n',                   // 闭合 ATX → 去掉尾部 ##
  '1) one\n2) two\n',                 // ) 有序列表 → 规范化为 .
  '***both***\n',                     // 三星粗斜
  '# Title\n\n\n\n\npara\n',          // 多余空行
  '    indented code\n',              // 缩进代码块 → 规范化为围栏
  '#Title without space is paragraph\n', // 非标题，应原样保留为段落
  '- [ ] task with star\n* [x] done\n', // 混用列表符的任务列表
  '[link](https://a.com)  \nhard break\n', // 两空格硬换行
  '# CR\r\n\r\nLF\n',                 // CRLF 混合
  '>quote no space\n',                // 引用无空格
  'text\n---\n',                      // setext H2 形式 → ATX
  '| a|b |\n|--|--|\n|1|2 |\n',       // 无填充表格
]

describe('非 canonical 输入的不动点语义', () => {
  test.each(perturbed.map((x, i) => [i, x] as const))(
    'case %i: roundtrip(roundtrip(x)) === roundtrip(x) 且结构等价',
    async (_i, input) => {
      const h1 = await createTestEditor(input)
      const once = h1.getMarkdown()
      const json1 = h1.getJSON()
      h1.destroy()

      const h2 = await createTestEditor(once)
      const twice = h2.getMarkdown()
      const json2 = h2.getJSON()
      h2.destroy()

      expect(twice).toBe(once)          // 第一次序列化的输出必须稳定
      expect(json2).toEqual(json1)      // parse(x) 与 parse(roundtrip(x)) 结构相等
    },
  )
})
