# Ancient World Strategy — Cursor Development Kit

A production-minded starter and prompt package for a large-scale, turn-based historical-fantasy browser strategy game.

The intended experience combines:

- A province-based grand strategy map.
- Nation building, settlement development, economy, population, supply, diplomacy, exploration, and research.
- Army organization and operational movement.
- Formation-scale battles that can visually contain thousands of soldiers.
- Small-party tactical encounters with individual actions, equipment, injuries, morale, and missions.
- A historical world near 84 BCE on a full-earth province map, with clearly separated fantasy divergence.

The repository is deliberately an architecture-first vertical-slice scaffold. It prevents the most common failure mode in AI-assisted game development: generating dozens of disconnected systems before proving one complete, testable game loop.

## Recommended stack

| Concern | Choice |
| --- | --- |
| 2D renderer | Phaser 4, WebGL-first |
| Application UI | React 19 |
| Build/dev server | Vite 8 |
| Language | TypeScript 7 |
| Workspace | pnpm + Turborepo |
| Validation | Zod 4 |
| Tests | Vitest |
| Formatting/linting | Biome |
| Persistent local saves | IndexedDB; Dexie when the save repository is implemented |
| Heavy simulation | Dedicated Web Workers |
| Data model | Commands, deterministic reducers, snapshots, versioned content |
| Large battle storage | Struct-of-arrays and typed arrays |
| CI | GitHub Actions |

Three.js remains a possible future escape hatch for a custom renderer, but it is not the default. This game is fundamentally a 2D strategy game; Phaser supplies scenes, cameras, textures, input, animation, audio, and specialized high-throughput 2D renderers without requiring a bespoke engine layer.

## Repository map

```text
apps/client/                    React + Phaser browser app
packages/sim-core/              Deterministic strategic simulation
packages/battle-sim/            Typed-array tactical simulation primitives
packages/game-data/             Zod schemas and content validation
content/                        Human-editable game definitions
art/                            Source manifests and non-generated asset metadata
tools/assets/                   Asset validation/import helpers
docs/                           Architecture, scale, testing, roadmap, ADRs
prompts/                        Reusable Cursor prompts
.cursor/rules/                  Persistent, scoped project constraints
.cursor/skills/                 On-demand development workflows
.cursor/agents/                 Three focused subagents
.cursor/hooks.json              Agent edit formatting hook
```

## Commands

```bash
pnpm dev                 # run the browser app
pnpm build               # production build
pnpm typecheck           # all package type checks
pnpm test                # deterministic and schema tests
pnpm lint                # Biome checks
pnpm format              # write formatting changes
pnpm content:references  # zero-dependency ID/reference checks
pnpm content:validate    # Zod schema and content tests
pnpm assets:validate     # validate the example asset manifest
pnpm check               # lint + typecheck + test + build
```

For a first-time checkout, run `scripts/bootstrap.ps1` on Windows or `scripts/bootstrap.sh` on macOS/Linux/WSL. The bootstrap enables Corepack, installs the pinned pnpm version, validates the environment, and runs the full gate. Commit the generated `pnpm-lock.yaml` after reviewing the initial install.

## Demo controls

- Strategic map: click a province; use the React panel to end a turn.
- Press `B` to open the large-unit rendering benchmark.
- Press `M` to return to the map.
- Mouse wheel zooms and drag pans in the benchmark.

The benchmark is not a promise that every target device will sustain the same density. It exists to establish and track an explicit performance envelope.

## Design guardrails

The project treats “large scale” as a hierarchy and level-of-detail problem:

- An inactive province is summarized, not simulated household by household.
- An army on the world map is an aggregate with cohorts, supply, command, and doctrine.
- A battlefield formation owns combat state; soldiers usually visualize that state.
- Only tactically important agents receive individual decision making.
- Simulation is independent of frame rate and rendering.
- Randomness always comes from an explicit seeded stream.
- Save files are versioned snapshots plus enough command history to reproduce and diagnose outcomes.
- Content is data, not hard-coded conditionals spread through scenes.
- Performance claims must be backed by a reproducible benchmark.

See `docs/ARCHITECTURE.md` and `docs/SCALE_MODEL.md`.

## Cursor operating model

Use one chat per logical feature. Start complex work in Plan mode. Keep persistent facts in rules, repeatable procedures in skills, and context-isolated review in the three focused subagents.

The main workflow is:

```text
plan → write acceptance criteria → implement smallest slice → test →
profile when relevant → verify architecture boundaries → update docs/ADR →
report changed files and commands
```

See `docs/CURSOR_OPERATING_MANUAL.md`.

## Asset policy

Sorceress can be used to create or analyze pixel sprite sheets, but every imported asset still needs:

- A stable asset ID.
- Source and creator provenance.
- The license or rights basis.
- Commercial-use and attribution notes.
- Pixel dimensions, pivot, animation tags, and atlas assignment.
- A hash so accidental binary changes can be detected.

Never assume that running an image through a conversion tool grants rights to the source image. See `docs/ASSET_PIPELINE.md`.

## Historical-fantasy policy

Historical claims and fantasy inventions are stored separately. Every faction, place, event, and character may carry source notes, confidence, and a divergence classification. The initial content is placeholder balancing data, not a claim of academic accuracy.

See `docs/HISTORICAL_FANTASY_POLICY.md`.

## Status

This package provides a coherent scaffold and AI-development system. It is not a finished game, and the sample map/content are intentionally small. Build the defined vertical slice before expanding the world.

See `VALIDATION_REPORT.md` for exactly what was verified in the generated package and which browser/dependency checks still need to run after the first local install.

## Package integrity

`FILE_MANIFEST.txt` records the byte size and SHA-256 digest of every packaged source file except the manifest itself. The distributed ZIP also has a separate `.sha256` checksum beside it.
