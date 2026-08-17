---
name: save-migration
description: Change save or authoritative content schema safely with version increments, ordered migrations, fixtures, validation, replay assessment, and failure handling.
paths:
  - "packages/sim-core/**/*.ts"
  - "packages/game-data/**/*.ts"
  - "apps/client/src/persistence/**/*.ts"
disable-model-invocation: false
---

# Save Migration

Read `docs/SAVE_AND_REPLAY.md`.

## Before editing

- Identify current schema/content/engine versions.
- Decide whether the change is additive, migratable, or intentionally incompatible.
- Locate prior-version fixture saves and replays.
- Specify defaults from historical data versus current definitions.

## Required work

1. Increment the correct version.
2. Add a one-way ordered migration `N → N+1`.
3. Validate input shape before migration.
4. Transform without mutating the original blob.
5. Validate output shape.
6. Preserve unknown extension data when policy permits.
7. Add/update a prior-version fixture.
8. Test direct load, migration, corrupt input, missing content, and continuation.
9. Verify state hash/replay expectations under the recorded engine version.
10. Keep the original save untouched on failure.
11. Update compatibility documentation.

Never fix migrations by deleting fixtures or silently dropping invalid entities.
