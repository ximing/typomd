import { expect, test } from '@playwright/test'

test('toolbar visible:false 完全不渲染，悬浮条/Slash 不受影响', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.mdeditor-toolbar')).toBeVisible()
  await page.locator('[data-testid="toolbar-visible"]').click()
  await expect(page.locator('.mdeditor-toolbar')).toHaveCount(0)
  // Slash 仍可用（spec §6.2：不受影响）
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  await expect(page.locator('[data-testid="slash-menu"]')).toBeVisible()
})

test('主题切换加/去 .mdeditor-dark 类', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="theme-toggle"]').click()
  await expect(page.locator('.mdeditor-dark')).toHaveCount(1)
})
