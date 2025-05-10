import { expect, test } from '@playwright/test'

// 视觉基线（§11）：基线在 CI Linux 环境生成与校验（字体渲染确定性）。
// 本地默认跳过；确需本机强制跑用 VISUAL_LOCAL=1（macOS 产物不可入库）。
test.describe('视觉基线', () => {
  test.skip(() => !process.env.CI && !process.env.VISUAL_LOCAL, '基线环境外跳过（设 VISUAL_LOCAL=1 本机强制跑）')

  test('编辑器排版：亮色', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="mdeditor"]')).toHaveAttribute('data-ready', 'true')
    await expect(page.locator('.demo-main')).toHaveScreenshot('editor-light.png')
  })

  test('编辑器排版：暗色', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="theme-toggle"]').click()
    await expect(page.locator('[data-testid="mdeditor"]')).toHaveAttribute('data-ready', 'true')
    await expect(page.locator('.demo-main')).toHaveScreenshot('editor-dark.png')
  })

  test('Slash 菜单展开', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('/')
    await expect(page.locator('[data-testid="slash-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="slash-menu"]')).toHaveScreenshot('slash-menu.png')
  })

  test('悬浮工具栏', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('hello world')
    await page.keyboard.press('Shift+ArrowLeft')
    await page.keyboard.press('Shift+ArrowLeft')
    await expect(page.locator('[data-testid="floating-toolbar"]')).toBeVisible()
    await expect(page.locator('[data-testid="floating-toolbar"]')).toHaveScreenshot('floating-toolbar.png')
  })

  test('工具栏激活态', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+b')
    await expect(page.locator('.mdeditor-toolbar [data-command="bold"]')).toHaveAttribute('data-active', 'true')
    await expect(page.locator('.mdeditor-toolbar')).toHaveScreenshot('toolbar-active.png')
  })
})
