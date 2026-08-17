# Master Bootstrap Prompt for Cursor

Paste this into a new Cursor Agent chat in **Plan mode** from the repository root.

---

You are the lead engineer for this repository. We are building a browser-first, turn-based historical-fantasy strategy game set in 84 BCE on a full-earth province map. It combines a province-based grand strategy campaign, settlement and nation building, armies and formations, visually massive battles, and small-party tactical missions. Read `docs/STATUS.md` and `docs/ANCIENT_WORLD_84BCE.md` before planning.

This is a long-lived solo-developer project. Optimize for a coherent vertical slice, deterministic behavior, measurable browser performance, content tooling, and maintainability—not maximum code generation.

## First action: orient, do not edit

Read:

- `START_HERE.md`
- `PROJECT_CONFIG.md`
- `AGENTS.md`
- `docs/VISION.md`
- `docs/ARCHITECTURE.md`
- `docs/SCALE_MODEL.md`
- `docs/VERTICAL_SLICE.md`
- `docs/ROADMAP.md`
- `docs/SIMULATION_CONTRACT.md`
- `docs/PERFORMANCE_BUDGETS.md`
- All accepted ADRs
- Root and package manifests
- Existing source/tests

Then inspect the actual repository state and report:

1. What already runs.
2. What is scaffold versus implemented behavior.
3. Any dependency, TypeScript, Phaser 4, worker, test, or build problems.
4. The current deterministic contract and state hash behavior.
5. The smallest work required to satisfy Milestone 0.

Do not propose building the full game.

## Required architecture

- Phaser 4 is the WebGL 2D renderer.
- React owns semantic application UI.
- Authoritative strategic and battle rules remain in renderer-independent TypeScript packages.
- Simulations use commands, stable ordering, seeded named RNG streams, integer/fixed-point values where practical, domain events, snapshots, and hashes.
- Strategic simulation runs behind a Web Worker boundary.
- Formations are authoritative in large battles. Soldiers are usually visual instances.
- Never create per-soldier AI, physics, pathfinders, React components, or mutable domain objects.
- `SpriteGPULayer` is only for compatible one-texture populations with batched/infrequent buffer updates. Use normal sprites or another renderer for interactive/dynamic exceptions.
- Visual density never changes authoritative results.
- Content is Zod-validated data with stable IDs and references.
- Saves/replays are versioned.
- Historical claims, gameplay abstractions, and fantasy divergence remain distinguishable.
- Do not copy D&D proper nouns, setting lore, stat blocks, spell text, art, or trade dress.
- Do not add backend/multiplayer/WASM before the offline vertical slice proves the need.

## Planning output

Create a Milestone 0 plan with:

- User-visible outcome.
- Acceptance criteria.
- Non-goals.
- Current defects/gaps.
- Exact files/packages.
- Dependency/install decisions.
- Data flow and worker messages.
- Determinism checks.
- Tests and browser smoke steps.
- Performance benchmark setup.
- Documentation/ADR effects.
- Ordered implementation increments, each independently testable.
- Completion commands.

Call out uncertainty rather than inventing APIs. Check installed package types or official Phaser source before using Phaser 4-only APIs.

## Implementation instruction

After I approve the plan, implement only the first accepted increment. Work through tests and actual command output. Do not claim completion from code inspection alone.

At the end of every increment, report:

- Player/developer capability added.
- Changed files.
- Commands run and results.
- State hashes or benchmark results when relevant.
- Assumptions.
- Remaining risks.
- The next smallest increment.
