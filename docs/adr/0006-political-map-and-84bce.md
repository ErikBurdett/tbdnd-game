# ADR-0006: Political map of 84 BCE is visible; fog hides operations

- Status: accepted
- Date: 2026-08-17

## Context

The default campaign is a full-earth province graph. Operational fog hid owner, name, food, unrest, and armies on unscouted land. On thousands of cells that made the earth a grey grid, so factions appeared not to exist.

A Europa Universalis-scale game needs players to see who holds land. They should not see every foreign army and harvest from the first turn.

## Decision

1. Starting date and default theater are **84 BCE, entire earth**, recorded in `PROJECT_CONFIG.md` and `docs/ANCIENT_WORLD_84BCE.md`.
2. The read model always includes `ownerId` (political knowledge).
3. Fog still hides food, unrest, unnamed-cell identity, and armies outside visibility.
4. Political assignment is reconstructed data in the map toolchain, not Phaser or React rules.
5. Land without an attested state is a **cultural region** (`faction.culture.*`) or numbered unorganized land. Do not invent later empires. Victory and harvest treat cultural homeland as non-organized unless a storehouse is built.

## Consequences

- The strategic map can color nations without scouting the planet.
- AI and combat still use authoritative owners; only presentation of intel changed.
- Old saves that assumed hidden owners still deserialize; the UI will now show those owners.
- Content catalog IDs (`roman-empire`) and runtime IDs (`faction.rome`) remain separate until a later content-pack merge.

## Alternatives considered

- Keep full fog, including owner: rejected; the earth map is unreadable.
- Show named places only, hide owner on numbered land: rejected; blobs would still vanish.
- Authoritative “known world” flags per faction: postponed; more state than this slice needs.

## Verification

- Fog unit test expects an unscouted province to keep `ownerId` and omit `food`.
- Earth-map test expects Han’s capital owner to be visible to Rome while remaining unscouted.
- `pnpm map:build` regenerates the pack from politics + Natural Earth land.
