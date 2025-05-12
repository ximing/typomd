import { expect, test } from '@playwright/test'

test('Slash 唤起、过滤、插入', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('[data-testid="typomd"] .ProseMirror')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  const menu = page.locator('[data-testid="slash-menu"]')
  await expect(menu).toBeVisible()
  await page.keyboard.type('格') // 唯一命中「表格」；「表」还会命中「无序列表」等，分组后 Enter 会选中列表项
  // demo 的 onChange 有 300ms debounce（onChangeDebounce=300），Slash 菜单的 change
  // 监听同样走此 debounce——键入查询词后须等 debounce 交付 change 事件，菜单才会过滤。
  // 否则 items 仍为未过滤全集（table 可见但非首项），Enter 会选中首项 heading 而非 table。
  await page.waitForTimeout(350)
  await expect(menu.locator('[data-command="table"]')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(editor.locator('table')).toBeVisible()
  // '/表' 残留文本已被清理
  await expect(editor).not.toContainText('/表')
})
