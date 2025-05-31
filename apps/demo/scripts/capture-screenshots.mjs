#!/usr/bin/env node
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const out = resolve(root, 'docs/images')
mkdirSync(out, { recursive: true })
console.log('out', out)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 960, height: 1200 },
  deviceScaleFactor: 2,
})

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(
  () => document.querySelector('[data-testid="typomd"]')?.getAttribute('data-ready') === 'true',
  null,
  { timeout: 60_000 },
)
await page.locator('.typomd-mermaid svg').first().waitFor({ state: 'visible', timeout: 20_000 })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(500)

const card = page.locator('[data-testid="demo-editor"]')
await card.screenshot({ path: resolve(out, 'editor-light.png'), animations: 'disabled' })
console.log('wrote editor-light.png')

await page.locator('[data-testid="theme-toggle"]').click()
await page.locator('html.typomd-dark').waitFor()
await page.waitForTimeout(1200)
await card.screenshot({ path: resolve(out, 'editor-dark.png'), animations: 'disabled' })
console.log('wrote editor-dark.png')

// back to light for slash / floating
await page.locator('[data-testid="theme-toggle"]').click()
await page.waitForTimeout(200)

const editor = page.locator('[data-testid="typomd"] .ProseMirror')
await editor.click()
await page.keyboard.press('Meta+a')
await page.keyboard.press('Backspace')
await page.keyboard.type('/')
const slash = page.locator('[data-testid="slash-menu"]')
await slash.waitFor({ state: 'visible', timeout: 10_000 })
await slash.screenshot({ path: resolve(out, 'slash.png'), animations: 'disabled' })

await page.keyboard.press('Escape')
await editor.click()
await page.keyboard.press('Meta+a')
await page.keyboard.press('Backspace')
await page.keyboard.type('hello world')
await page.keyboard.press('Shift+ArrowLeft')
await page.keyboard.press('Shift+ArrowLeft')
const floating = page.locator('[data-testid="floating-toolbar"]')
await floating.waitFor({ state: 'visible' })
await floating.screenshot({ path: resolve(out, 'floating.png'), animations: 'disabled' })

// OG image: light editor card, 1200x630 canvas
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(
  () => document.querySelector('[data-testid="typomd"]')?.getAttribute('data-ready') === 'true',
  null,
  { timeout: 60_000 },
)
await page.locator('.typomd-mermaid svg').first().waitFor({ state: 'visible', timeout: 20_000 })
const ogPage = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await ogPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
await ogPage.waitForFunction(
  () => document.querySelector('[data-testid="typomd"]')?.getAttribute('data-ready') === 'true',
  null,
  { timeout: 60_000 },
)
await ogPage.locator('.typomd-mermaid svg').first().waitFor({ state: 'visible', timeout: 20_000 })
await ogPage.evaluate(() => document.fonts.ready)
await ogPage.waitForTimeout(300)
await ogPage.screenshot({
  path: resolve(root, 'apps/demo/public/og.png'),
  animations: 'disabled',
})
await ogPage.close()

await browser.close()
console.log('wrote screenshots to', out)
