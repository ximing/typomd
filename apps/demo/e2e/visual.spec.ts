import { expect, test, type Page } from '@playwright/test'

// 视觉基线（§8.4）：基线在 CI Linux 环境生成与校验（字体渲染确定性）。
// 本地默认跳过；确需本机强制跑用 VISUAL_LOCAL=1（macOS 产物不可入库——跑完即删）。
// 更新 Linux 基线：bash apps/demo/scripts/update-visual-snapshots.sh
//
// 场景集共 15 张（§8.4）：
//   全页亮/暗（2）+ Slash 展开亮/暗（2）+ 浮动工具栏亮/暗（2）+ 工具栏激活态（1）
//   + 表格/任务列表/引用块/代码块局部特写亮/暗各一（8）。
//
// 局部特写定位到具体块（toHaveScreenshot 只截该 locator 边界框），
// 懒渲染的 mermaid 自然落在视口外，避免基线抖动；仅全页截图需等 mermaid svg 落定。
//
// 暗色变体统一模式（Task 10 起 .typomd-dark 挂在 <html>）：
//   await page.locator('[data-testid="theme-toggle"]').click()
//   await expect(page.locator('html.typomd-dark')).toHaveCount(1)

const TYPOMD = '[data-testid="typomd"]'
const EDITOR = `${TYPOMD} .ProseMirror`
const MERMAID_SVG = `${EDITOR} .typomd-mermaid svg`

/** 打开页面并等编辑器就绪 + 字体 + mermaid 首屏渲染落定（§8.4：避免异步渲染抖动）
 *
 * 冷启超时健壮性：vite dev 按需模块变换在 4 核 Linux 容器首帧要把 mermaid/katex/shiki
 * 深依赖图全量变换，默认 goto('load') 会卡在变换瀑布 >60s；故 goto 改 'domcontentloaded'
 * （HTML 解析即返回），真正的就绪交由下方显式等待（data-ready + mermaid svg + fonts）。
 * 不改变截图内容——显式等待仍保证同一落定态，仅 goto 返回时机 + 断言/用例超时放宽。 */
async function ready(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // 冷启 createEditor + 模块瀑布 + mermaid/katex/shiki 在 4 核容器首帧远超默认 5s，放宽到 60s
  await expect(page.locator(TYPOMD)).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
  await expect(page.locator(MERMAID_SVG).first()).toBeVisible({ timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready)
}

/** 切暗色并断言 <html> 挂类（Task 10：类由 .typomd-root 迁至 <html>） */
async function enableDark(page: Page) {
  await page.locator('[data-testid="theme-toggle"]').click()
  await expect(page.locator('html.typomd-dark')).toHaveCount(1)
}

/** 清空编辑器后键入 '/' 唤起 Slash 菜单 */
async function openSlash(page: Page) {
  await page.locator(EDITOR).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('/')
  await expect(page.locator('[data-testid="slash-menu"]')).toBeVisible({ timeout: 10_000 })
}

/** 键入 'hello world' 并反向选 2 字符唤起浮动工具栏 */
async function openFloating(page: Page) {
  await page.locator(EDITOR).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('hello world')
  await page.keyboard.press('Shift+ArrowLeft')
  await page.keyboard.press('Shift+ArrowLeft')
  await expect(page.locator('[data-testid="floating-toolbar"]')).toBeVisible()
}

test.describe('视觉基线', () => {
  // 冷启首帧（editor-light）vite 模块瀑布 ~60-90s；放宽到 180s 覆盖冷启，
  // 后续 14 用例命中 vite 暖缓存即快。仅此文件（describe 级，覆盖全部 15 用例）。
  test.describe.configure({ timeout: 180_000 })
  test.skip(() => !process.env.CI && !process.env.VISUAL_LOCAL, '基线环境外跳过（设 VISUAL_LOCAL=1 本机强制跑）')

  // 1. 全页 亮
  test('编辑器全页：亮色', async ({ page }) => {
    await ready(page)
    await expect(page.locator('.demo-main')).toHaveScreenshot('editor-light.png')
  })

  // 2. 全页 暗
  test('编辑器全页：暗色', async ({ page }) => {
    await ready(page)
    // 捕获亮色 mermaid svg 签名：view.ts 每次 render 用自增 seq 作 svg id，
    // 主题切换触发 MutationObserver 重渲染 → 新 svg；旧 svg 保留到新 svg 就绪（无骨架闪烁），
    // 故仅靠 toBeVisible 无法判定 swap 完成——需正信号：outerHTML 已变。
    const lightSig = await page.locator(MERMAID_SVG).first().evaluate((el) => el.outerHTML)
    await enableDark(page)
    // 等 mermaid 双主题重渲染 swap 完成（§8.4：避免截图面内 mermaid 抖动）
    await page.waitForFunction(
      (prev) => {
        const el = document.querySelector('.typomd-mermaid svg')
        return !!el && el.outerHTML !== prev
      },
      lightSig,
      { timeout: 15_000 },
    )
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.demo-main')).toHaveScreenshot('editor-dark.png')
  })

  // 3. Slash 展开 亮
  test('Slash 菜单展开：亮色', async ({ page }) => {
    await ready(page)
    await openSlash(page)
    await expect(page.locator('[data-testid="slash-menu"]')).toHaveScreenshot('slash-light.png')
  })

  // 4. Slash 展开 暗
  test('Slash 菜单展开：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await openSlash(page)
    await expect(page.locator('[data-testid="slash-menu"]')).toHaveScreenshot('slash-dark.png')
  })

  // 5. 浮动工具栏 亮
  test('浮动工具栏：亮色', async ({ page }) => {
    await ready(page)
    await openFloating(page)
    await expect(page.locator('[data-testid="floating-toolbar"]')).toHaveScreenshot('floating-light.png')
  })

  // 6. 浮动工具栏 暗
  test('浮动工具栏：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await openFloating(page)
    await expect(page.locator('[data-testid="floating-toolbar"]')).toHaveScreenshot('floating-dark.png')
  })

  // 7. 工具栏激活态
  test('工具栏激活态', async ({ page }) => {
    await ready(page)
    await page.locator(EDITOR).click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+b')
    await expect(page.locator('.typomd-toolbar [data-command="bold"]')).toHaveAttribute('data-active', 'true')
    await expect(page.locator('.typomd-toolbar')).toHaveScreenshot('toolbar-active.png')
  })

  // 8. 表格特写 亮
  test('表格特写：亮色', async ({ page }) => {
    await ready(page)
    await expect(page.locator(`${EDITOR} table`).first()).toHaveScreenshot('block-table-light.png')
  })

  // 9. 表格特写 暗
  test('表格特写：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await expect(page.locator(`${EDITOR} table`).first()).toHaveScreenshot('block-table-dark.png')
  })

  // 10. 任务列表特写 亮
  test('任务列表特写：亮色', async ({ page }) => {
    await ready(page)
    await expect(page.locator(`${EDITOR} ul:has(li[data-checked])`).first()).toHaveScreenshot('block-tasklist-light.png')
  })

  // 11. 任务列表特写 暗
  test('任务列表特写：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await expect(page.locator(`${EDITOR} ul:has(li[data-checked])`).first()).toHaveScreenshot('block-tasklist-dark.png')
  })

  // 12. 引用块特写 亮（依赖 fixtures.ts 补的 blockquote）
  test('引用块特写：亮色', async ({ page }) => {
    await ready(page)
    await expect(page.locator(`${EDITOR} blockquote`).first()).toHaveScreenshot('block-quote-light.png')
  })

  // 13. 引用块特写 暗
  test('引用块特写：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await expect(page.locator(`${EDITOR} blockquote`).first()).toHaveScreenshot('block-quote-dark.png')
  })

  // 14. 代码块特写 亮
  test('代码块特写：亮色', async ({ page }) => {
    await ready(page)
    await expect(page.locator(`${EDITOR} pre`).first()).toHaveScreenshot('block-code-light.png')
  })

  // 15. 代码块特写 暗
  test('代码块特写：暗色', async ({ page }) => {
    await ready(page)
    await enableDark(page)
    await expect(page.locator(`${EDITOR} pre`).first()).toHaveScreenshot('block-code-dark.png')
  })
})
