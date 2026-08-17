# ADR-0002: Authoritative simulation is deterministic and renderer-independent

- Status: accepted
- Date: 2026-08-16

## Context

The game needs saves, replays, AI tests, worker execution, long campaigns, and a possible future multiplayer mode. Putting rules in scenes or UI would make results frame-dependent and difficult to test.

## Decision

All authoritative campaign and battle rules live in pure TypeScript packages. Commands, seeded random streams, stable ordering, integer/fixed-point values, events, and state hashes define the contract.

Rendering and real time are presentation concerns.

## Consequences

- Headless tests and replay diagnostics are possible.
- Workers and future networking have a clean boundary.
- Developers must write read-model and renderer adapters.
- Care is required around ordering and numeric behavior.

## Verification

- Architectural import tests.
- Determinism fixtures.
- Replay equivalence.
- Save/load continuation hashes.
