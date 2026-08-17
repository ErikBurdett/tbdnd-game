$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js 22 or newer is required."
}

$NodeMajor = [int]((& node -p 'Number(process.versions.node.split(".")[0])').Trim())
if ($NodeMajor -lt 22) {
    throw "Node.js 22 or newer is required; found $(& node --version)."
}

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    throw "Corepack is required, or install pnpm 11.22.0 manually."
}

& corepack enable
& pnpm --version
& pnpm install
& pnpm doctor
& pnpm check

Write-Host ""
Write-Host "Bootstrap complete. Run: pnpm dev"
Write-Host "Commit pnpm-lock.yaml after reviewing the first successful install."
