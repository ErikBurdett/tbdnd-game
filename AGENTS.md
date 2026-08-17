# Agent Instructions

Read `START_HERE.md`, `PROJECT_CONFIG.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`, and the nearest package README before changing multiple files.

## Non-negotiable boundaries

- `packages/sim-core` and `packages/battle-sim` must not import Phaser, React, DOM APIs, browser storage, wall-clock time, or network clients.
- Phaser scenes render and translate input; they do not own authoritative game rules.
- React renders application UI; it does not update per-frame entity state.
- All simulation randomness comes from an explicit seeded RNG. Never call `Math.random()` in authoritative code.
- Simulation behavior must not depend on render frame rate.
- Use integer/fixed-point values for authoritative spatial and economic calculations where practical.
- Content definitions are data validated at boundaries.
- Never assign a physics body, pathfinder, or autonomous planner to every visible soldier.
- Treat generated images, packed atlases, map chunks, build output, and lockfiles as generated artifacts; change source inputs or generation tools instead.

## Work procedure

For any multi-file feature:

1. Restate the bounded outcome and acceptance criteria.
2. Search for existing contracts and tests before writing code.
3. Identify package boundaries and data migrations.
4. Implement the smallest end-to-end path.
5. Add or update deterministic tests.
6. Run the narrowest relevant checks, then `pnpm check` before declaring completion.
7. Profile rendering or simulation work that affects scale.
8. Update the relevant document or ADR when an architectural decision changes.
9. Report changed files, commands run, results, assumptions, and remaining risk.

Do not silently broaden scope. Do not leave placeholder implementations presented as complete. Do not disable tests, loosen types, or suppress errors to make checks pass.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm content:validate
pnpm assets:validate
```
