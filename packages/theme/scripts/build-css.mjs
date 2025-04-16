import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..')

const PREFIX = '--mdeditor-'

/** tokens.json → default.css 文本。亮色落在 :root/.mdeditor，暗色只覆写颜色。 */
export function buildCss(tokens) {
  const lines = ['/* 由 scripts/build-css.mjs 生成，请勿手改 */', '']
  lines.push(':root, .mdeditor {')
  for (const [k, v] of Object.entries(tokens.shared)) lines.push(`  ${PREFIX}${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.light)) lines.push(`  ${PREFIX}${k}: ${v};`)
  lines.push('}', '')
  lines.push('.mdeditor-dark {')
  for (const [k, v] of Object.entries(tokens.dark)) lines.push(`  ${PREFIX}${k}: ${v};`)
  lines.push('}', '')
  // 结构性样式：仅编辑容器必需的最小集（spec §6.4：仅含极少量结构性 CSS）
  lines.push('.mdeditor .ProseMirror {')
  lines.push(`  background: var(${PREFIX}color-bg);`)
  lines.push(`  color: var(${PREFIX}color-text);`)
  lines.push(`  font-family: var(${PREFIX}font-text);`)
  lines.push(`  font-size: var(${PREFIX}font-size);`)
  lines.push(`  line-height: var(${PREFIX}line-height);`)
  lines.push(`  padding: var(${PREFIX}space-4);`)
  lines.push('  outline: none;')
  lines.push('}')
  lines.push('.mdeditor .ProseMirror code, .mdeditor .ProseMirror pre {')
  lines.push(`  font-family: var(${PREFIX}font-mono);`)
  lines.push(`  background: var(${PREFIX}color-code-bg);`)
  lines.push(`  border-radius: var(${PREFIX}radius);`)
  lines.push('}')
  lines.push('.mdeditor .ProseMirror blockquote {')
  lines.push(`  border-left: 3px solid var(${PREFIX}color-quote-border);`)
  lines.push(`  color: var(${PREFIX}color-text-muted);`)
  lines.push(`  margin-left: 0; padding-left: var(${PREFIX}space-3);`)
  lines.push('}')
  lines.push('.mdeditor .ProseMirror ::selection {')
  lines.push(`  background: var(${PREFIX}color-selection);`)
  lines.push('}')
  // math/mermaid 失败降级角标（spec §8）
  lines.push('.mdeditor-node-error {')
  lines.push(`  color: var(${PREFIX}color-error);`)
  lines.push(`  border: 1px dashed var(${PREFIX}color-error);`)
  lines.push(`  border-radius: var(${PREFIX}radius);`)
  lines.push(`  padding: var(${PREFIX}space-1) var(${PREFIX}space-2);`)
  lines.push('}')
  // Shiki 双主题（core codeHighlight preset 输出 --shiki-light/--shiki-dark 变量）
  lines.push('.mdeditor-dark .ProseMirror pre span {')
  lines.push('  color: var(--shiki-dark) !important;')
  lines.push('}')
  // placeholder：react 层把 data-placeholder 直接挂在 .ProseMirror 上
  // （MdEditorInner 在 ready 后执行 setAttribute——::before 的 attr() 只能读
  // 伪元素所在元素自身的属性，挂祖先 .mdeditor 上 content: attr() 会读空串）。
  // 空文档判定不能用 p:empty——已核实 prosemirror-view 会给空 textblock 插入
  // <br class="ProseMirror-trailingBreak">，空段落实为 <p><br ...></p>，:empty 永不匹配。
  // 改为匹配 trailing break：有文本时 PM 不再插入该 br，条件自然失效；
  // 段落末尾硬换行也会加 trailingBreak，但那时 br 不是 only-child，不误判。
  lines.push('.mdeditor .ProseMirror[data-placeholder]:has(> p:first-child:last-child > br.ProseMirror-trailingBreak:only-child)::before {')
  lines.push(`  content: attr(data-placeholder);`)
  lines.push(`  color: var(${PREFIX}color-text-muted);`)
  // 备查：::before 用 position: absolute 但未给 .ProseMirror 加 position: relative；
  // 当前无偏移量时按静态位置放置表现正确，若未来给 ::before 加 top/left 偏移，
  // 需补 .ProseMirror { position: relative }
  lines.push('  position: absolute;')
  lines.push('  pointer-events: none;')
  lines.push('}')
  return lines.join('\n') + '\n'
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tokens = JSON.parse(readFileSync(join(pkgRoot, 'src/tokens.json'), 'utf8'))
  mkdirSync(join(pkgRoot, 'dist'), { recursive: true })
  writeFileSync(join(pkgRoot, 'dist/default.css'), buildCss(tokens))
  copyFileSync(join(pkgRoot, 'src/tokens.json'), join(pkgRoot, 'dist/tokens.json'))
  console.log('theme: dist/default.css + dist/tokens.json generated')
}
