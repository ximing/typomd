import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..')

const PREFIX = '--mdeditor-'

const HEADER = '/* 由 scripts/build-css.mjs 生成，请勿手改 */'

function tokenLines(obj, indent = '  ') {
  return Object.entries(obj).map(([k, v]) => `${indent}${PREFIX}${k}: ${v};`)
}

function lightBlock(tokens) {
  return [
    ':root, .mdeditor {',
    ...tokenLines(tokens.shared),
    ...tokenLines(tokens.light),
    '}',
  ].join('\n')
}

function darkBlock(tokens) {
  return ['.mdeditor-dark {', ...tokenLines(tokens.dark), '}'].join('\n')
}

function mediaDarkBlock(tokens) {
  return [
    '@media (prefers-color-scheme: dark) {',
    '  :root, .mdeditor {',
    ...tokenLines(tokens.dark, '    '),
    '  }',
    '}',
  ].join('\n')
}

function readContent() {
  return {
    content: readFileSync(join(pkgRoot, 'src/content.css'), 'utf8').trimEnd(),
    contentDark: readFileSync(join(pkgRoot, 'src/content-dark.css'), 'utf8').trimEnd(),
  }
}

/** tokens.json → default.css 文本。亮色落在 :root/.mdeditor，暗色只覆写颜色（§3.2）。 */
export function buildCss(tokens) {
  const { content, contentDark } = readContent()
  return [HEADER, '', lightBlock(tokens), '', darkBlock(tokens), '', content, '', contentDark, ''].join('\n')
}

/** tokens.json → auto.css 文本：暗色令牌与暗色内容规则改由系统媒体查询触发（§3.2）。 */
export function buildAutoCss(tokens) {
  const { content, contentDark } = readContent()
  const transformed = contentDark
    .split('.mdeditor-dark ')
    .join('.mdeditor ')
    .split('\n')
    .map((l) => (l.length ? `  ${l}` : l))
    .join('\n')
  return [HEADER, '', lightBlock(tokens), '', mediaDarkBlock(tokens), '', content, '',
    '@media (prefers-color-scheme: dark) {', transformed, '}', ''].join('\n')
}

/** 构建期校验（§3.2）：亮/暗键集合一致；content-dark.css 每条规则以 .mdeditor-dark 开头 */
function validate(tokens) {
  const lk = Object.keys(tokens.light).sort()
  const dk = Object.keys(tokens.dark).sort()
  if (JSON.stringify(lk) !== JSON.stringify(dk)) {
    throw new Error(`亮/暗令牌键不对齐:\n  light-only: ${lk.filter((k) => !dk.includes(k))}\n  dark-only: ${dk.filter((k) => !lk.includes(k))}`)
  }
  const { contentDark } = readContent()
  for (const line of contentDark.split('\n')) {
    const t = line.trim()
    if (t.endsWith('{') && !t.startsWith('.mdeditor-dark ')) {
      throw new Error(`content-dark.css 存在非 .mdeditor-dark 开头的选择器: ${t}`)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tokens = JSON.parse(readFileSync(join(pkgRoot, 'src/tokens.json'), 'utf8'))
  validate(tokens)
  mkdirSync(join(pkgRoot, 'dist'), { recursive: true })
  writeFileSync(join(pkgRoot, 'dist/default.css'), buildCss(tokens))
  writeFileSync(join(pkgRoot, 'dist/auto.css'), buildAutoCss(tokens))
  copyFileSync(join(pkgRoot, 'src/tokens.json'), join(pkgRoot, 'dist/tokens.json'))
  console.log('theme: dist/default.css + dist/auto.css + dist/tokens.json generated')
}
