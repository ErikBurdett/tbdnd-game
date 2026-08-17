# Architecture

## Core rule

Authoritative game state lives in deterministic simulation packages. Rendering, UI, storage, audio, analytics, and networking are adapters around that core.

```text
             React UI
                │
                │ commands / read models
                ▼
        Runtime / Worker Bridge
                │
                │ typed messages
                ▼
┌───────────────────────────────────────┐
│ Deterministic simulation             │
│                                      │
│ sim-core      battle-sim             │
│ commands      formations             │
│ reducers      fixed-step systems     │
│ events        typed arrays           │
│ snapshots     hashes                 │
└───────────────────────────────────────┘
                │
                │ render snapshots / events
                ▼
          Phaser Renderer
```

## Package responsibilities

### `apps/client`

Owns:

- Browser bootstrap.
- React panels, menus, accessibility surface, and layout.
- Phaser game creation and scene lifecycle.
- Web Worker clients and message routing.
- Presentation-only interpolation and effects.
- Input mapping.
- Development diagnostics.

Must not own:

- Combat formulas.
- Economic resolution.
- AI decisions.
- Canonical random rolls.
- Save migration logic embedded in components.
- Per-frame React entity updates.

### `packages/sim-core`

Owns:

- Campaign state contracts.
- Commands and validation.
- Strategic turn phases.
- Seeded random streams.
- World events.
- Deterministic state hashing.
- Replay application.
- Read-model builders that do not use browser APIs.

Restrictions:

- No Phaser, React, DOM, storage, network, timers, locale-sensitive formatting, or `Math.random`.
- No dependence on object iteration order when order affects outcomes.
- No current date/time as an input unless supplied in a command or configuration.

### `packages/battle-sim`

Owns:

- Formation and tactical state.
- Fixed-step or phase-step battle resolution.
- Dense IDs and struct-of-arrays storage.
- Morale, cohesion, fatigue, casualties, frontage, contact, and order resolution.
- Spatial indexing that is deterministic.
- Snapshot extraction for the renderer.

Restrictions are the same as `sim-core`.

### `packages/game-data`

Owns:

- Zod schemas.
- Content IDs and references.
- Cross-file validation.
- Content version.
- Historical provenance and divergence metadata.
- Test fixtures.

It does not own mutable campaign state.

### `tools/assets`

Owns:

- Asset manifest validation.
- Import normalization.
- Atlas metadata conversion.
- Provenance and rights checks.
- Hashing and generated output conventions.

## State flow

### Input

Presentation converts device input into semantic intent:

```ts
{ type: "army.move.requested", armyId, destinationProvinceId }
```

The UI may preview the result, but only the simulation validates and accepts the authoritative command.

### Resolution

The simulation:

1. Validates the command against current state.
2. Produces a deterministic command result.
3. Mutates or replaces state only inside the simulation boundary.
4. Emits domain events.
5. Updates the state hash.
6. Returns a compact read model and events.

### Presentation

React and Phaser consume:

- Read models designed for the current view.
- Domain events for animation and messaging.
- IDs for selection and drill-down.
- Non-authoritative interpolation state.

They do not infer hidden game rules from animation.

## Mutation model

Determinism does not require universal immutability. Large states may use controlled in-place mutation for performance.

Rules:

- Mutation is isolated to simulation functions.
- Commands are processed in an explicit stable order.
- Public callers cannot hold mutable references to internal arrays.
- Tests compare state hashes and relevant snapshots.
- Debug builds may assert invariants after each phase.
- Read models are copied, frozen, transferred, or treated as immutable.

## Worker model

Start with one campaign worker. Add a battle worker when the battle slice becomes active.

Use message passing and transferable buffers first. Introduce `SharedArrayBuffer` only after profiling proves a need and the deployment can support cross-origin isolation headers.

Recommended channels:

```text
client → worker: initialize, submitCommands, resolveTurn, requestSnapshot
worker → client: ready, commandAccepted, commandRejected, progress, snapshot, events, fault
```

A worker operation that may exceed a frame should report progress and process bounded chunks. It must never silently depend on `setTimeout` ordering for game correctness.

## Time models

Keep clocks explicit:

- Campaign calendar: integer turn and year/month fields.
- Operational movement: integer movement points or travel ticks.
- Battle resolution: integer phases or fixed simulation ticks.
- Presentation: real elapsed milliseconds, never authoritative.
- Save metadata: wall-clock timestamp, clearly outside state hash.

## Dependency direction

```text
game-data ───────┐
                 ▼
             sim-core
                 ▲
                 │ shared contracts
             battle-sim

apps/client → all packages
tools/assets → schemas or generated metadata only
```

`sim-core` may depend on stable content interfaces but should not load files. The client/worker bootstrap resolves content and passes validated definitions in.

## Architectural fitness checks

CI and Cursor reviews should detect:

- `Math.random` under simulation packages.
- `phaser`, `react`, `window`, `document`, `localStorage`, or `fetch` imports/references in simulation packages.
- Simulation code reading `performance.now()` or `Date.now()`.
- Content IDs referenced but not defined.
- Non-versioned save changes.
- benchmark regressions above the agreed threshold.
- React lists that render individual battlefield soldiers.
