#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 22 )); then
  echo "Node.js 22 or newer is required; found $(node --version)." >&2
  exit 1
fi

if ! command -v corepack >/dev/null 2>&1; then
  echo "Corepack is required, or install pnpm 11.22.0 manually." >&2
  exit 1
fi

corepack enable
pnpm --version
pnpm install
pnpm doctor
pnpm check

echo
echo "Bootstrap complete. Run: pnpm dev"
echo "Commit pnpm-lock.yaml after reviewing the first successful install."
