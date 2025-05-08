import { expect, test } from '@playwright/test'

test('工具栏键盘导航（§6）：真实 Tab 进工具栏、方向键移动、Enter 触发、Esc 返回', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  // demo 默认文档非空；与其余 e2e 相同，先清空再键入，否则 Cmd+A 会选中整篇 DEMO_MARKDOWN
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('hello')
  await page.keyboard.press('ControlOrMeta+a')
  // 真实 Tab 序：编辑器前一个停点即工具栏唯一 tab 停点（roving：仅首钮 tabIndex=0）
  await page.keyboard.press('Shift+Tab')
  const first = page.locator('.mdeditor-toolbar-button').first()
  await expect(first).toBeFocused()
  await expect(page.locator('.mdeditor-toolbar-button').nth(1)).toHaveAttribute('tabindex', '-1')
  // 默认顺序 undo/redo/heading/bold → ArrowRight ×3 到 bold
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-command="bold"]').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(editor.locator('strong')).toHaveText('hello')
  // §5.3：点击/Enter 触发后焦点回编辑器
  await expect(editor).toBeFocused()
  // Esc 返回编辑器（roving 停点在最后一次导航到的按钮上，不假设是首钮）
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('.mdeditor-toolbar-button[tabindex="0"]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(editor).toBeFocused()
})

test('Slash 键盘全流程（§6）：打开/aria 指向/ Esc 关闭', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  const menu = page.locator('[data-testid="slash-menu"]')
  await expect(menu).toBeVisible()
  // §5.5：打开期间编辑器持有 aria-activedescendant
  await expect(editor).toHaveAttribute('aria-activedescendant', 'mdeditor-slash-opt-heading')
  await page.keyboard.press('ArrowDown')
  await expect(editor).toHaveAttribute('aria-activedescendant', 'mdeditor-slash-opt-bold')
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(editor).not.toHaveAttribute('aria-activedescendant', /.+/)
})

test('reduced-motion（§2.2）：浮层动画时长被压为 ~0', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  await expect(page.locator('[data-testid="slash-menu"]')).toBeVisible()
  const duration = await page.evaluate(() => {
    const el = document.querySelector('.mdeditor-slash')!
    return getComputedStyle(el).animationDuration
  })
  expect(parseFloat(duration)).toBeLessThan(0.01)
})
