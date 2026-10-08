#!/usr/bin/env bash
# 启动本地预览。端口自动分配（不写死），被占用时自动顺延。
#   ./start.sh
#   PORT=5173 ./start.sh
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "需要 Node.js（>= 18），未找到。" >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "需要 Node.js >= 18，当前 $(node -v)。" >&2
  exit 1
fi

exec node serve.mjs "$@"