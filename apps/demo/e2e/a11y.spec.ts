import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test('axe：亮色 0 violations（§7）', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="typomd"]')).toHaveAttribute('data-ready', 'true')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe：暗色 0 violations（§7）', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="theme-toggle"]').click()
  await expect(page.locator('html.typomd-dark')).toHaveCount(1)
  // §5.8 主题过渡：.demo-page 有 240ms background-color transition（--typomd-duration-slow）。
  // 类一挂即触发过渡，axe 若在过渡中途 analyze 会测到中间色（实测 #3a3a3a 等）误报 color-contrast。
  // 待 background-color 落到 dark canvas（#0f0f0f → rgb(15,15,15)）后再扫。
  await expect.poll(
    () => page.evaluate(() => getComputedStyle(document.querySelector('.demo-page') as HTMLElement).backgroundColor),
    { timeout: 5000, message: '暗色主题过渡完成（.demo-page background-color 落到 dark canvas）' },
  ).toBe('rgb(15, 15, 15)')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
