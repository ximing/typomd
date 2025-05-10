// apps/demo/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: {
    baseURL: 'http://localhost:5173',
    // CI/Docker 默认 /dev/shm 仅 64MB，会让 Chromium 在加载 mermaid/shiki 时崩页
    ...(process.env.CI ? { launchOptions: { args: ['--disable-dev-shm-usage'] } } : {}),
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
