#!/usr/bin/env bash
# 在 Linux Playwright 镜像里生成 visual.spec.ts 基线 PNG 并写入
# apps/demo/e2e/visual.spec.ts-snapshots/（macOS 本机产物不可入库，§11）。
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
image="mcr.microsoft.com/playwright:v1.62.1-noble"
exec docker run --rm \
  --memory=4g \
  --shm-size=2g \
  -v "$root":/work \
  -v /work/node_modules \
  -w /work \
  -e CI=1 \
  -e NODE_OPTIONS=--max-old-space-size=2048 \
  -e http_proxy= -e https_proxy= -e HTTP_PROXY= -e HTTPS_PROXY= \
  "$image" \
  bash -lc 'set -euo pipefail
    corepack enable
    corepack prepare pnpm@9.15.4 --activate
    pnpm install --frozen-lockfile
    pnpm --filter @typomd/core --filter @typomd/theme --filter @typomd/react build
    pnpm --filter demo exec playwright test e2e/visual.spec.ts --update-snapshots --workers=1
  '
