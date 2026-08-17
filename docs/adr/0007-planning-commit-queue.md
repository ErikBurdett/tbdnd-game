# ADR-0007: Planning orders commit on end turn

- Status: accepted
- Date: 2026-08-17

## Context

`PROJECT_CONFIG.md` defines strategic resolution as planning → commit → deterministic resolution → aftermath. Marches were applying immediately, so the player could not issue a set of orders and then resolve the month.

## Decision

1. `army.move` during `planning` validates and queues. The army stays in place.
2. `strategic.end-turn` enters `resolution`, applies the queue in issue order, then AI, economy, and upkeep, then returns to `planning`.
3. A second move for the same army replaces the queued order. `order.cancel` removes it.
4. Recruit and settlement construction stay immediate planning actions (they already have their own costs and queues).
5. Missing `orderQueue` on old snapshots migrates to `[]`.

## Consequences

- Click-to-march no longer relocates the army until the turn is committed.
- Two player armies cannot reserve the same destination.
- Saves from before this ADR deserialize with an empty queue.

## Alternatives considered

- Immediate marches plus a command log: rejected; it is not a planning phase.
- Queue recruit and buildings too: postponed; occupancy and treasury reservation need a later slice.
