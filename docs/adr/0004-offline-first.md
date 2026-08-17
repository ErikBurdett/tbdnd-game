# ADR-0004: Build the offline single-player vertical slice before a backend

- Status: accepted
- Date: 2026-08-16

## Context

Cloud saves and multiplayer add authentication, synchronization, security, deployment, and compatibility work before the core game is proven.

## Decision

The first playable is entirely local. It uses IndexedDB for persistence and deterministic command interfaces that can later support synchronization.

## Consequences

- Faster iteration on the game.
- No account or server requirement for the slice.
- Multiplayer constraints are considered at interfaces but not allowed to dominate implementation.
- Backend work requires a later ADR.

## Verification

- Full loop works offline.
- Save/replay are stable.
- No privileged secret is required in the client.
