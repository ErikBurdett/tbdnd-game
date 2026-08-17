# Deterministic Simulation Contract

## Purpose

Given the same:

- Engine version.
- Content version.
- Initial seed.
- Initial state.
- Ordered command sequence.

the simulation must produce the same authoritative events, state, and hash.

## Forbidden authoritative inputs

- `Math.random()`.
- `Date.now()`, `performance.now()`, timers, or frame delta.
- Browser locale or timezone.
- Network response ordering.
- Object keys whose order is not explicitly sorted where order changes results.
- Floating-point comparisons near unstable thresholds without a declared strategy.
- UI animation state.
- GPU output.
- Unseeded UUID generation.

Wall-clock metadata may exist outside the hashed state.

## Random streams

Use named independent streams so adding a cosmetic roll does not change battle outcomes.

Examples:

```text
world-generation
strategic-events
faction-ai:<factionId>
battle:<battleId>
mission:<missionId>
character-generation
```

Derive each stream seed deterministically from campaign seed and stable identifiers.

A command or event may record a stream checkpoint for debugging, but random results should normally be reproducible from the state.

## Ordering

Every unordered collection must gain a stable order before outcome-affecting processing.

Recommended order key:

```text
phasePriority → initiative/orderPriority → stable numeric ID → command ID
```

Never trust insertion order after loading historical saves unless the format guarantees it and tests it.

## Numbers

Prefer integers:

- Currency in smallest unit.
- Rates in basis points or fixed scale.
- Position in fixed-point units.
- Time in turns/ticks.
- Morale/cohesion in bounded integer ranges.
- Probability as an integer threshold against a 32-bit roll.

Floating point is acceptable for presentation. When used authoritatively, document rounding and test cross-runtime consistency.

## Command processing

For each command:

1. Validate envelope revision and actor authority.
2. Validate game-phase legality.
3. Validate referenced entities and visibility.
4. Calculate costs and constraints from authoritative state.
5. Apply in one deterministic transaction.
6. Emit ordered events.
7. Increment revision.
8. Assert invariants in development/test mode.
9. Update or checkpoint state hash.

A rejected command does not consume random numbers unless the contract explicitly says it does.

## Field battle (Milestone 1 stand-in)

A march into a province that already holds a foreign army is a field battle, not an empty occupation.

- Higher strength wins. Equal strength: the defender holds.
- The loser is destroyed. The winner loses `max(1, floor(loserStrength / 10))` strength, remaining at least 1.
- No RNG is consumed. Formation battle handoff replaces this rule in Milestone 4.
- AI uses the same `army.move` application path during end-turn resolution. It does not mutate state directly.
- AI will reclaim empty player-owned land and will not attack a stronger army or another AI faction.

## Recruitment

`army.recruit` spends 80 treasury and places a 600-strength levy on an empty owned province. It uses the same command envelope as movement. Stacking on an occupied province is illegal.

## Fog of war

The player read model, when built with a viewer faction, omits:

- Province owner, food, and unrest for land not owned, occupied, or adjacent to owned/occupied land.
- Armies standing on hidden land.
- Enemy treasury.

Authoritative `WorldState` stays complete. AI still reads the full state for its own legal moves. Hashing uses the unfiltered world.

## Turn phases

Suggested campaign phases:

```text
planning
commit
diplomacy
intelligence
movement
interception
battle-handoff
economy
population
construction
recruitment
research
events
aftermath
```

Only the simulation controls phase transitions.

## Hashing

A diagnostic state hash should:

- Exclude presentation and wall-clock metadata.
- Use canonical key order.
- Include schema/content version.
- Include RNG stream state.
- Include all authoritative entities and queues.
- Be cheap enough to compute at checkpoints.

A simple stable hash is sufficient for debugging; cryptographic integrity may be added to save storage separately.

## Replays

A replay includes:

- Initial scenario ID or snapshot.
- Campaign seed.
- Engine/content/schema versions.
- Accepted commands in authoritative order.
- Optional periodic hashes/checkpoints.
- Optional player annotations.

Replay verification runs headless without Phaser or React.

## Compatibility

Changing a formula may intentionally change future outcomes. Then:

- Increment engine or rules version.
- Keep old saves supported through migration or declare a clear compatibility boundary.
- Store version with replay.
- Never silently load a replay under different rules and call a mismatch corruption.

## Determinism test pattern

1. Create the same fixture twice.
2. Apply identical commands.
3. Compare emitted event sequences.
4. Compare state hashes after every phase.
5. Serialize and load one state.
6. Continue both runs.
7. Compare again.

Add fuzz/property tests that generate valid command sequences from a fixed seed.
