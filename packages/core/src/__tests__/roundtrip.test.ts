// __tests__/roundtrip.test.ts
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { FeatureFlags } from '../types'
import { createTestEditor } from './helpers'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const fixtures = readdirSync(fixturesDir).filter((f) => f.endsWith('.md'))

/**
 * fixture → 所需 features。新增 feature 节点 fixture 时必须在此登记
 * （Task 8 登记 math.md，Task 9 登记 mermaid.md），否则测试不经过目标节点。
 */
const FEATURES: Record<string, FeatureFlags> = {
  'math.md': { math: true },          // Task 8
  'mermaid.md': { mermaid: true },    // Task 9
}

describe('canonical fixture roundtrip（字符串恒等）', () => {
  test.each(fixtures)('%s', async (file) => {
    const md = readFileSync(join(fixturesDir, file), 'utf8')
    const handle = await createTestEditor(md, FEATURES[file])
    expect(handle.getMarkdown()).toBe(md)
    handle.destroy()
  })
})
