import { expect, test } from '@playwright/test'

test('toolbar visible:false 完全不渲染，悬浮条/Slash 不受影响', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.typomd-toolbar')).toBeVisible()
  await page.locator('[data-testid="toolbar-visible"]').click()
  await expect(page.locator('.typomd-toolbar')).toHaveCount(0)
  // Slash 仍可用（spec §6.2：不受影响）
  const editor = page.locator('[data-testid="typomd"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  await expect(page.locator('[data-testid="slash-menu"]')).toBeVisible()
})

test('主题切换加/去 .typomd-dark 类', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="theme-toggle"]').click()
  await expect(page.locator('.typomd-dark')).toHaveCount(1)
})

test('主题切换后编辑器画布使用暗色令牌（祖先类须覆写 .typomd 亮色块）', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="theme-toggle"]').click()
  const editor = page.locator('[data-testid="typomd"] .ProseMirror')
  await expect(editor).toBeVisible()
  await expect(editor).toHaveCSS('background-color', 'rgb(25, 25, 25)')
})
