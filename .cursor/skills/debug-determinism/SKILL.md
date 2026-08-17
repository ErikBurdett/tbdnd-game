---
name: debug-determinism
description: Find the first cause of a replay, save/load, same-seed, worker, or cross-runtime deterministic mismatch.
paths:
  - "packages/sim-core/**/*.ts"
  - "packages/battle-sim/**/*.ts"
  - "apps/client/src/workers/**/*.ts"
disable-model-invocation: false
---

# Debug Determinism

Do not patch the final hash or sort everything indiscriminately. Find the earliest semantic divergence.

## Procedure

1. Capture:
   - Engine/content/schema versions.
   - Seed and RNG stream states.
   - Initial snapshot hash.
   - Accepted command sequence.
   - Checkpoint hashes by turn/phase.
2. Reproduce twice in the smallest headless fixture.
3. Find the first mismatched checkpoint.
4. Bisect:
   - Turn.
   - Phase.
   - Command/event sequence.
   - State section.
5. Compare:
   - Stable processing order.
   - Rejected-command RNG consumption.
   - RNG stream derivation.
   - Floating-point threshold/rounding.
   - Serialization defaults.
   - Map/set/object iteration.
   - Dense ID assignment.
   - Worker message sequencing.
   - Hidden wall-clock/frame inputs.
6. Add a diagnostic assertion or canonical diff that identifies the first path.
7. Write a regression test before applying the minimal fix.
8. Re-run duplicate, save/load continuation, and replay checks.

## Report

State the first divergence, root cause, why the fix preserves rules, compatibility impact, and exact hashes/tests.
