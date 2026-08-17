---
name: implement-sim-system
description: Implement or change an authoritative campaign or battle simulation system with deterministic commands, phases, events, invariants, and tests.
paths:
  - "packages/sim-core/**/*.ts"
  - "packages/battle-sim/**/*.ts"
disable-model-invocation: false
---

# Implement Simulation System

Read `docs/SIMULATION_CONTRACT.md` and the relevant package.

## Contract first

Write down:

- Inputs.
- Authoritative state read.
- State written.
- Phase/order.
- Numeric units.
- RNG stream and exact roll points.
- Events emitted.
- Invariants.
- Complexity at target count.

## Implementation rules

- Use semantic command intent, not precomputed outcomes.
- Validate before mutation.
- Process IDs in stable order.
- Use named seeded RNG.
- Do not consume randomness for rejected commands.
- Use integer/fixed-point authoritative values.
- Isolate controlled mutation.
- Avoid allocation and object graphs in hot loops.
- Keep browser and renderer APIs out.
- Return structured failures.
- Build a compact read/snapshot boundary separately.

## Required tests

- Happy path.
- Rejection with no partial state change.
- Boundary values.
- Stable tie-break.
- Same-seed duplicate run.
- Save/serialize midpoint continuation.
- Invariant/property fixture.
- Benchmark or operation-count fixture when scale-sensitive.

## Completion

Run package tests/typecheck and then the repository completion gate. Include a state-hash comparison in the report.
