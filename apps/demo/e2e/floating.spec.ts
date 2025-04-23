import { expect, test } from '@playwright/test'

test('选中文字 → 悬浮工具栏 → 加粗', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('选中我')
  await page.keyboard.press('Shift+ArrowLeft')
  await page.keyboard.press('Shift+ArrowLeft')
  await page.keyboard.press('Shift+ArrowLeft')
  const floating = page.locator('[data-testid="floating-toolbar"]')
  await expect(floating).toBeVisible()
  await floating.locator('[data-command="bold"]').click()
  await expect(editor.locator('strong')).toHaveText('选中我')
  await expect(page.locator('[data-testid="markdown-output"]')).toContainText('**选中我**')
})
