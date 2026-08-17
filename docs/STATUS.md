# Current status

Living snapshot for agents and reviewers. Update this file when a playable loop or geography contract changes.

## Date and map

- Starting date: **84 BCE**.
- Default map: full-earth 2° land graph, 4063 provinces, Natural Earth 50m coasts, reconstructed political boxes (`earth.84bce.5`).
- Peoples: 27 playable attested states, additional non-playable tribal belts, and cultural regions (`faction.culture.*`) where no state can be attested. Victory and harvest ignore undeveloped cultural land.
- Zoom LOD: far zoom merges owner blobs; mid zoom shows spaced regional names; numbered land appears only when a cell is large enough.
- Map camera: drag or WASD to pan, wheel or +/− to zoom toward the cursor, H/Recenter for the player capital. The first view opens on that capital.
- Contract: `docs/ANCIENT_WORLD_84BCE.md`.
- Rebuild: `pnpm map:build` from `tools/map/earth-84bce-politics.mjs`. Do not edit `earth84bce.json` by hand.

## What a new player can do today

1. Choose an attested 84 BCE people on the hall, or enter as **Aurelian** (Rome, no password).
2. Inspect the political map (owners are visible; foreign armies and harvests are not). Drag or WASD to pan, wheel or +/− to zoom toward the cursor, H or Recenter to return to your capital. Commit turn stays at the top of the side panel.
3. Queue a march during planning. **Commit turn** resolves player orders, then AI, harvest, and upkeep. Empty foreign land is occupied. Guarded land auto-resolves a field battle.
4. Raise a levy on empty owned land (80 treasury).
5. Inspect a **capital settlement** and queue one building at a time: **storehouse** (80 gold, +3 food/turn), **training ground** (110 gold, +200 levy strength, −1 gold/turn), or **civic hall** (90 gold, +2 gold/turn, −1 unrest/turn).
6. Study **Composite Bow Doctrine** (+100 levy strength) or **Ritual Astronomy** (+1 food/turn). Organized Logistics is already known, so the three buildings stay available.
7. Commit the turn: queued marches resolve, AI takes one legal move, harvests resolve, armies pay 2 treasury upkeep each.
8. Save from the in-game menu. Demo play does not require an account.

## What is not in yet

- Population, supply lines, and an arcane building.
- Formation battles and party missions (benchmark scene only).
- Hand-drawn coasts and surveyed 84 BCE borders.

## Test fixtures

- `createSampleWorld()` — three-province Aurelian Frontier, used by most unit tests.
- `createEarthWorld()` — playable default.
- `simulateAurelianCampaign()` — 22-turn Consular War as Rome.

## Content vs runtime

The Zod catalog in `content/core` is a schematic citation theater (`roman-empire`, 7 provinces). Runtime IDs are `faction.rome` and `province.latium` on the earth pack. Mapping is in `docs/ANCIENT_WORLD_84BCE.md`.
