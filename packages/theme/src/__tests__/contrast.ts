// contrast.ts — WCAG 相对亮度对比度（测试工具，不随包导出）
type Rgba = [number, number, number, number]

function parseColor(c: string): Rgba {
  if (c.startsWith('#')) {
    const hex = c.slice(1)
    const full = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex
    const n = parseInt(full, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`无法解析颜色: ${c}`)
  const parts = m[1]!.split(',').map((s) => Number(s.trim()))
  return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1]
}

function compositeOver(fg: Rgba, bg: [number, number, number]): [number, number, number] {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)]
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** fg 若为半透明色，先合成到 bg 上再算对比度（§6） */
export function contrast(fg: string, bg: string): number {
  const f = parseColor(fg)
  const b = parseColor(bg)
  const frgb: [number, number, number] =
    f[3] < 1 ? compositeOver(f, [b[0], b[1], b[2]]) : [f[0], f[1], f[2]]
  const l1 = luminance(frgb)
  const l2 = luminance([b[0], b[1], b[2]])
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
