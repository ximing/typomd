import { expect, test } from '@playwright/test'

test('输入 markdown 语法即时渲染为富文本', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
  await editor.click()
  // 清空默认文档后输入
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  // 验证 data-placeholder 挂载在 .ProseMirror 上（属性挂载位置，可见性见下一条断言）
  await expect(editor).toHaveAttribute('data-placeholder', '输入 / 唤起命令...')
  // 视觉路径进 e2e：::before 的 content 必须非空（选择器命中 trailingBreak 条件才成立；
  // getComputedStyle 对未命中的伪元素返回 'none'/空串）
  const beforeContent = await page.evaluate(() => {
    const pm = document.querySelector('[data-testid="mdeditor"] .ProseMirror')!
    return getComputedStyle(pm, '::before').content
  })
  expect(beforeContent).toBe('"输入 / 唤起命令..."')
  await expect(editor.locator('h1')).toHaveCount(0)
  await page.keyboard.type('# 标题一')
  await expect(editor.locator('h1')).toHaveText('标题一')
  await page.keyboard.press('Enter')
  await page.keyboard.type('**加粗**')
  await expect(editor.locator('strong')).toHaveText('加粗')
  // markdown 输出面板同步
  await expect(page.locator('[data-testid="markdown-output"]')).toContainText('# 标题一')
})
