import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..')

const PREFIX = '--typomd-'

const HEADER = '/* 由 scripts/build-css.mjs 生成，请勿手改 */'

function tokenLines(obj, indent = '  ') {
  return Object.entries(obj).map(([k, v]) => `${indent}${PREFIX}${k}: ${v};`)
}

function lightBlock(tokens) {
  return [
    ':root, .typomd {',
    ...tokenLines(tokens.shared),
    ...tokenLines(tokens.light),
    '}',
  ].join('\n')
}

function darkBlock(tokens) {
  // 亮色挂在 `:root, .typomd`。若只给祖先加 `.typomd-dark`，子级 `.typomd`
  // 仍会重写为亮色令牌（demo 主题切换正文画布不跟主题）。必须同时覆写后代 `.typomd`。
  return ['.typomd-dark, .typomd-dark .typomd {', ...tokenLines(tokens.dark), '}'].join('\n')
}

function mediaDarkBlock(tokens) {
  return [
    '@media (prefers-color-scheme: dark) {',
    '  :root, .typomd {',
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

/** 从 workspace @typomd/core 的 katex 解析官方 CSS（构建期，不新增运行时依赖）。 */
export function resolveKatexCssPath() {
  const require = createRequire(join(pkgRoot, '../core/package.json'))
  return require.resolve('katex/dist/katex.min.css')
}

/** 内联 katex.min.css：只保留 woff2，路径改为 ./fonts/（与 dist/fonts 并列）。 */
export function katexCss() {
  let css = readFileSync(resolveKatexCssPath(), 'utf8')
  css = css.replace(
    /url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)(?:,url\(fonts\/[^)]+\.woff\) format\("woff"\))?(?:,url\(fonts\/[^)]+\.ttf\) format\("truetype"\))?/g,
    'url(./fonts/$1.woff2) format("woff2")',
  )
  return `/* katex.min.css（构建期内联，woff2 见 dist/fonts） */\n${css}`
}

export function copyKatexFonts(destDir = join(pkgRoot, 'dist/fonts')) {
  const fontsDir = join(dirname(resolveKatexCssPath()), 'fonts')
  mkdirSync(destDir, { recursive: true })
  for (const f of readdirSync(fontsDir)) {
    if (f.endsWith('.woff2')) copyFileSync(join(fontsDir, f), join(destDir, f))
  }
}

/** tokens.json → default.css 文本。亮色落在 :root/.typomd，暗色只覆写颜色（§3.2）。 */
export function buildCss(tokens) {
  const { content, contentDark } = readContent()
  return [HEADER, '', lightBlock(tokens), '', darkBlock(tokens), '', content, '', contentDark, '', katexCss(), ''].join('\n')
}

/** tokens.json → auto.css 文本：暗色令牌与暗色内容规则改由系统媒体查询触发（§3.2）。 */
export function buildAutoCss(tokens) {
  const { content, contentDark } = readContent()
  const transformed = contentDark
    .split('.typomd-dark ')
    .join('.typomd ')
    .split('\n')
    .map((l) => (l.length ? `  ${l}` : l))
    .join('\n')
  return [HEADER, '', lightBlock(tokens), '', mediaDarkBlock(tokens), '', content, '',
    '@media (prefers-color-scheme: dark) {', transformed, '}', '', katexCss(), ''].join('\n')
}

/** 构建期校验（§3.2）：亮/暗键集合一致；content-dark.css 每条规则以 .typomd-dark 开头 */
function validate(tokens) {
  const lk = Object.keys(tokens.light).sort()
  const dk = Object.keys(tokens.dark).sort()
  if (JSON.stringify(lk) !== JSON.stringify(dk)) {
    throw new Error(`亮/暗令牌键不对齐:\n  light-only: ${lk.filter((k) => !dk.includes(k))}\n  dark-only: ${dk.filter((k) => !lk.includes(k))}`)
  }
  const { contentDark } = readContent()
  for (const line of contentDark.split('\n')) {
    const t = line.trim()
    if (t.endsWith('{') && !t.startsWith('.typomd-dark ')) {
      throw new Error(`content-dark.css 存在非 .typomd-dark 开头的选择器: ${t}`)
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
  copyKatexFonts()
  console.log('theme: dist/default.css + dist/auto.css + dist/tokens.json + dist/fonts generated')
}
