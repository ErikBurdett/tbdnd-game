# Faction AI Prompt

Read `docs/AI_ARCHITECTURE.md`. Implement one AI capability through the same legal commands as the player.

Bounded example:

> An AI faction recognizes an adjacent threatened objective, scores legal army moves,
> chooses a move using its knowledge model and doctrine, submits the command, and records
> a readable score breakdown.

Requirements:

- No raw hidden-state access.
- Stable candidate order and deterministic ties.
- Explicit operation/candidate budget; deterministic fallback.
- Goal and utility breakdown visible in development diagnostics.
- No direct mutation.
- Fixed-seed decision tests.
- No-action, unreachable, low-supply, and equal-score cases.
- Turn-time instrumentation.

Do not attempt a general grand-strategy AI in one feature.
