# Start Here

This kit is designed to let one developer use Cursor agents without allowing the project to become an unmaintainable pile of generated code.

## The decision already made

Use **Phaser 4 as the 2D/WebGL renderer**, React for application UI, and a renderer-independent deterministic TypeScript simulation.

Do **not** put game rules inside Phaser scenes. Do **not** make one React component, physics body, pathfinder, or behavior tree per soldier.

The scale model is:

1. **World layer:** regions, provinces, settlements, factions, armies, trade, diplomacy, research, fog of war.
2. **Operational layer:** armies, detachments, routes, supply, missions, interception, sieges.
3. **Battle layer:** formations are authoritative; most visible soldiers are representations of formation state.
4. **Party layer:** a small number of individually simulated characters use high-fidelity XCOM-like rules.

This creates the impression of a vast world while keeping CPU, memory, save size, AI cost, and browser rendering bounded.

## First setup

Requirements:

- Git
- Node.js 22 or newer
- pnpm 11.22.0
- Current Cursor

Use the included bootstrap for your platform:

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

```bash
# macOS, Linux, or WSL
./scripts/bootstrap.sh
```

Or run the commands manually from the repository root:

```bash
corepack enable
pnpm install
pnpm doctor
pnpm check
pnpm dev
```

The first successful dependency install creates `pnpm-lock.yaml`. Review and commit it immediately. CI performs a bootstrap install only while that file is absent; after it exists, CI automatically requires a frozen lockfile.

If Corepack cannot create the pnpm shim, install the pinned package manager explicitly:

```bash
npm install --global pnpm@11.22.0
```

Open the repository root in Cursor. Cursor automatically discovers the project rules, skills, hooks, and focused subagents under `.cursor/`. Install the recommended Biome extension when Cursor offers it.

## Your first Cursor session

1. Open `PROJECT_CONFIG.md` and change any defaults you strongly disagree with.
2. Open a new Cursor Agent chat in **Plan mode**.
3. Paste the complete prompt from `prompts/00-master-bootstrap.md`.
4. Review the plan. Do not ask the agent to implement the whole game.
5. Have it complete only Milestone 0, run all checks, and commit that logical unit.
6. Start a new Agent chat and invoke `/build-vertical-slice`.

The intended first playable is defined in `docs/VERTICAL_SLICE.md`. The default campaign geography is the 84 BCE earth pack in `docs/ANCIENT_WORLD_84BCE.md`.

## What is already playable

See `docs/STATUS.md` for the living list. In short:

- Full-earth 84 BCE campaign with faction pick, a political map, and capital-centered camera controls.
- March, occupy, field auto-resolve, levy, capital buildings, research, army upkeep.
- Local commander profiles, demo-without-account, Aurelian Consular War save.
- Deterministic sim-core, battle-sim benchmark, Zod content catalog, workers, CI.

## The first non-negotiable milestone

Before adding diplomacy, procedural quests, hundreds of factions, multiplayer, or a world map, prove this loop:

> inspect province → manage one settlement → recruit one formation → move one army → trigger one mission or battle → resolve it → apply consequences → save → reload → reproduce the same result from the same seed

Anything that does not strengthen that loop belongs in the backlog.

## Important assumptions

The kit makes practical defaults rather than blocking on design questions:

- Single-player and offline-first.
- Monthly strategic turns using planning → commit → deterministic resolution → aftermath.
- WEGO formation battles for the initial tactical mode.
- Individual turn-based party encounters for missions.
- Default theater is the entire earth in 84 BCE; finer borders come later.
- Historical geography and political starting conditions, with explicitly marked fantasy divergences.
- Original tabletop-fantasy terminology and content; no copied D&D setting names, text, monsters, art, or trade dress.
- Desktop browser is the first performance target; mobile receives a reduced visual-density profile.
- Backend, cloud saves, and multiplayer come only after deterministic local saves and replays work.

These are editable in `PROJECT_CONFIG.md`.
