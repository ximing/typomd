// slash-query.ts
/**
 * 推导 Slash 查询词：菜单打开时记 markdown 快照 base，
 * 之后每次 change 取 curr 与 base 的最长公共前缀，差分部分即用户在 '/' 后键入的查询词。
 * 规避了 markdown offset ≠ ProseMirror pos 的映射问题。
 *
 * 必须 trimEnd：getMarkdown 输出以 '\n' 结尾（计划一已核实）。
 * 不 trim 时，键入第一个查询字符后 curr 变成 '.../x\n'，LCP 停在 base 的 '\n' 处，
 * 差分含换行 → 本函数返回 null → 菜单键入即关闭（e2e slash 关键路径必挂）。
 */
export function slashQueryFromDiff(base: string, curr: string): string | null {
  const b = base.trimEnd()
  const c = curr.trimEnd()
  let i = 0
  while (i < b.length && i < c.length && b[i] === c[i]) i++
  // curr 严格短于 base 且为前缀：用户删掉了 '/' → 关闭。
  // curr === base：debounce 把打开那次 '/' 再交付一遍 → 空查询，菜单保持打开。
  if (i === c.length && c.length < b.length) return null
  const inserted = c.slice(i)
  // 只允许连续非空白查询词；出现空白/换行说明用户已离开 slash 上下文
  const m = /^[^\s]*$/.exec(inserted)
  return m ? inserted : null
}
