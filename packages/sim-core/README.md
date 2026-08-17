# `@ancient/sim-core`

Renderer-independent deterministic campaign simulation.

Public responsibilities:

- Campaign state and IDs.
- Seeded RNG streams.
- Commands and structured rejection.
- Ordered events.
- State invariants and canonical hashes.
- Serialization and replay.

The sample implementation intentionally uses a tiny state. Add systems through commands and explicit turn phases; never import browser/renderer code.

`createSampleWorld()` remains the three-province fixture. The playable default is `createEarthWorld()` from the 84 BCE 2° earth pack. `army.move` queues during planning; `strategic.end-turn` commits the queue, then AI and economy. Capitals are settlements; `settlement.queue-building` starts a storehouse, training ground, or civic hall. `research.select` queues a doctrine. Map LOD helpers live in `maps/earthGeometry.ts`. See `docs/STATUS.md` and ADR-0007.
