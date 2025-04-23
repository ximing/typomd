import { expect, test } from '@playwright/test'

test.describe('渲染与失败降级（spec §8）', () => {
  test('KaTeX 渲染：默认文档含 .katex；非法公式降级为源码 + 错误角标', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
    await expect(editor.locator('.katex').first()).toBeVisible()

    // math/mermaid 节点只经 remark parse 产生、没有 input rule——键盘键入 $$
    // 只是普通文本，无法构造 math 节点。降级用例经 demo 调试按钮 setMarkdown 注入
    await page.locator('[data-testid="doc-bad-math"]').click()
    await expect(editor.locator('.mdeditor-math.mdeditor-node-error')).toBeVisible()
  })

  test('Mermaid 渲染为 SVG；非法源码降级为源码 + 错误角标', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="mdeditor"] .ProseMirror')
    await expect(editor.locator('.mdeditor-mermaid svg').first()).toBeVisible({ timeout: 15_000 })

    // 键盘键入 ``` 触发的是 code_block input rule 而非 mermaid 节点，同样经调试按钮注入
    await page.locator('[data-testid="doc-bad-mermaid"]').click()
    await expect(editor.locator('.mdeditor-mermaid.mdeditor-node-error')).toBeVisible({ timeout: 15_000 })
  })

  test('关闭 feature 后对应渲染消失（features 开关链路）', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="feature-mermaid"]').click() // 重建编辑器
    await expect(page.locator('[data-testid="mdeditor"] .ProseMirror .mdeditor-mermaid')).toHaveCount(0)
  })
})
