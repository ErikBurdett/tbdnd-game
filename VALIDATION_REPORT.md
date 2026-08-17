# Validation Report

Generated: **2026-08-16**

This report separates checks that actually ran in the artifact-generation environment from checks that still require a successful dependency install and browser runtime.

## Environment used

- Node.js: `v22.16.0`
- npm: `10.9.2`
- Available global TypeScript compiler: `5.8.3`
- Workspace package manager target: `pnpm@11.22.0`
- Workspace TypeScript target: `7.0.2`

The global compiler was used only for dependency-free source validation and syntax transpilation. It is not presented as a substitute for the pinned TypeScript 7 workspace check.

## Passed without installing workspace dependencies

The following checks ran successfully against the packaged files:

- Repository structure, required files, Cursor skill frontmatter, custom subagent frontmatter, and core JSON parsing.
- All 25 JSON files parsed successfully.
- Fourteen Cursor Agent Skills and three focused custom subagents passed structure/frontmatter checks.
- Architecture fitness checks that prevent React, Phaser, browser APIs, timers, wall-clock reads, and nondeterministic random calls from entering authoritative simulation packages.
- Asset-manifest path safety, SHA-256 hashes, PNG dimensions, frame references, provenance fields, and rights metadata.
- Content ID uniqueness, source citations, faction capitals, province owners, symmetric adjacency, research references, and research-cycle detection.
- Strict TypeScript source checking for the dependency-free campaign and battle simulation modules using the available global compiler.
- Syntax transpilation of 24 TypeScript/TSX files across `apps/client` and `packages/game-data`.
- JavaScript syntax for the project `.mjs` tooling.
- YAML parsing for both GitHub configuration files.
- Bash syntax for `scripts/bootstrap.sh`.

PowerShell was not installed in the generation environment, so `scripts/bootstrap.ps1` was reviewed but not runtime-parsed or executed.

## Pure simulation smoke test

A temporary CommonJS build of the dependency-free simulation sources was compiled and executed. The scenario verified:

- Same seed plus the same accepted commands produces identical replay checkpoints and final state hashes.
- Serialize/deserialize preserves the authoritative campaign hash.
- Continuing from an in-memory state and a deserialized state produces the same next-turn hash.
- A rejected non-adjacent army move does not mutate campaign state.
- Four 50×50 formation representations derive exactly 10,000 visual soldier slots at full density.
- The same formations derive 1,000 visual soldier slots at 10% density.
- Building render snapshots never mutates battle authority.
- Forty deterministic movement ticks produce identical authority hashes in independent runs.
- Changing visual density does not change the authoritative battle hash.

Observed reproducible values:

```json
{
  "campaignReplayHash": "252bf127",
  "continuationHash": "b35cd1e9",
  "rejectedCommandPreservedHash": "9f7b1f34",
  "battleAuthorityInitialHash": "c6ad7960",
  "battleAuthorityAfter40TicksHash": "7977ee18",
  "fullDensityVisuals": 10000,
  "tenPercentDensityVisuals": 1000
}
```

These values prove the included prototype logic behaved deterministically in this runtime. They are not a claim about the eventual full game simulation or renderer frame rate.

## Not run in this environment

A workspace dependency install could not complete because DNS resolution for `registry.npmjs.org` failed with `EAI_AGAIN`. Therefore the following are deliberately **not** claimed as verified here:

- A generated `pnpm-lock.yaml`; it does not exist yet and must be created by the first successful local install.
- Full TypeScript 7 workspace type checking with installed Phaser, React, Vite, Zod, Dexie, and Vitest types.
- Vitest execution through the workspace package scripts.
- Biome linting/format verification through the pinned workspace version.
- A Vite production build.
- Browser launch, input smoke testing, Web Worker behavior, IndexedDB behavior, or measured Phaser GPU benchmark results.
- Windows execution of `scripts/bootstrap.ps1`.

CI permits one bootstrap install while the lockfile is absent. Once `pnpm-lock.yaml` is committed, CI automatically switches to `--frozen-lockfile`.

## Required first local verification

From the repository root, run one of the bootstrap scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

```bash
./scripts/bootstrap.sh
```

Then:

1. Review and commit `pnpm-lock.yaml`.
2. Run `pnpm dev`.
3. Confirm the strategic map loads and province selection works.
4. End several turns, reload, and compare the displayed deterministic hash.
5. Press `B`, verify the 10,000-instance benchmark scene renders, and record real measurements using `benchmarks/result-template.json`.
6. Press `M` to return to the strategic map.
7. Run `pnpm check` again after any environment-specific fixes.

The benchmark scene is intentionally a static rendering stress test. It does not establish a complete-battle performance claim until real movement, effects, UI, visibility, simulation-worker traffic, and target-device measurements are evaluated together.
