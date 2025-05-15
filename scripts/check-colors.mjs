// scripts/check-colors.mjs — §8.2：源码不得出现字面色值（令牌单一来源防线）
// 白名单（逐条理由）：
//  - packages/core/src/presets/mermaid/：mermaid 在 JS 内渲染读不到 CSS 变量，
//    明/暗 themeVariables 默认值必须与 tokens.json §4.2 手工同步（对比度由 theme 单测覆盖）。
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN = ['packages/react/src', 'packages/core/src', 'packages/theme/src', 'apps/demo/src']
const EXCLUDE = /(__tests__|tokens\.json|build-css\.mjs)/
const WHITELIST = /packages\/core\/src\/presets\/mermaid\//
const PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\(/

let hits = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!/\.(css|ts|tsx)$/.test(name)) continue
    const rel = relative(ROOT, p)
    if (EXCLUDE.test(rel) || WHITELIST.test(rel)) continue
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (PATTERN.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`)
    })
  }
}
for (const d of SCAN) walk(join(ROOT, d))
if (hits.length) {
  console.error(`硬编码颜色检查失败（§8.2），共 ${hits.length} 处：\n${hits.join('\n')}`)
  process.exit(1)
}
console.log('硬编码颜色检查通过（§8.2）')
