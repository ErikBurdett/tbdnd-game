# First Playable Vertical Slice

## Goal

Prove one complete campaign-to-battle-to-consequence loop with deterministic save/replay. The slice should be fun enough to expose whether the architecture serves real decisions.

## Scenario

The shipped default is the 84 BCE earth pack (`docs/ANCIENT_WORLD_84BCE.md`). The content catalog still keeps a compact schematic theater for schema and citation work. Historical names on the earth pack are reconstructed gameplay geography, not surveyed borders.

Shipped default (2026-08-17):

- 4063-province 2° earth graph, 27 playable 84 BCE states plus cultural regions, capital settlements, zoom LOD.
- Political owners visible; operational fog on armies and harvests.
- Queue march / commit turn / occupy / field auto-resolve / levy / storehouse / training ground / civic hall / research / upkeep.
- Aurelian Consular War reviewer save.

Still required to close the original slice:

- Formation battle and one party mission writing back to campaign.
- Formation-facing research beyond the first three nodes, and an arcane building.
- One ruin/arcane site and an authored mission location.

## Player loop

1. Inspect faction, province, settlement, army, and research panels.
2. Queue one building.
3. Recruit a formation.
4. Assign or inspect a commander.
5. Queue an army march through adjacent provinces and commit the turn.
6. Spend supply and movement.
7. Trigger interception, mission, or battle.
8. Deploy formations and issue WEGO orders.
9. Resolve enough battle phases to rout or withdraw.
10. Apply casualties, experience, morale, loot, control, and political effects.
11. Commit the strategic turn (player orders, then AI and economy).
12. Save, reload, and reproduce the same final hash from replay.

## Content budget

| Type | Count |
| --- | ---: |
| Factions | 3 |
| Provinces | 18–24 |
| Settlements | 4–6 |
| Formation definitions | 8–12 |
| Buildings | 8–12 across 3 chains |
| Research nodes | 16 total |
| Resources/commodities | 4–6 |
| Character archetypes | 4 |
| Party abilities | 8–12 |
| Mission templates | 1 |
| Event templates | 8–12 |
| Battle maps | 1 generated/assembled biome |
| Unit visual sets | 2–4 reusable atlases |

## Battle scope

The actual battle should use:

- 12–24 formations.
- Formation authority.
- 500–2,000 visible soldier instances depending on density setting.
- Terrain zones.
- Facing, frontage, cohesion, fatigue, morale, casualties, rout, reserve, and withdrawal.
- A commander and one tactically special element per side.
- No individual collision or pathfinding for every soldier.

Separately, the benchmark scene tests 10,000 or more visual instances.

## Party mission scope

One compact encounter:

- 3–5 controllable characters.
- 4–8 opponents.
- Movement, cover or positional advantage, line of sight, attack, one spell/ritual, one interaction objective, injury, and extraction.
- Consequences projected back to campaign state.

Do not create a separate RPG progression universe. Reuse campaign characters, equipment tags, damage/status concepts, and world events.

## Acceptance criteria

### Functional

- The loop can be completed from a clean new game.
- Invalid commands return readable reasons.
- AI can take a legal turn and pursue the scenario objective.
- Battle outcome modifies campaign state.
- Party mission outcome modifies campaign state.
- Fog of war prevents unavailable information from reaching the player read model.
- Save/load produces an equivalent state hash.
- Replay from seed and command log produces the same result.

### Technical

- No simulation package imports browser or renderer code.
- No `Math.random` in authoritative packages.
- Worker failure produces a visible recoverable error.
- All content files pass schema and reference validation.
- The benchmark records FPS/frame time and visual count.
- The production build completes without type or lint suppression.
- Architecture changes have ADRs.
- CI passes from a clean checkout.

### UX

- Player can explain why a move is illegal.
- Player can inspect battle order, morale, fatigue, and likely contact.
- Important resolution events can be paused/reviewed.
- UI supports keyboard navigation for the strategic loop.
- Text is not embedded into pixel art assets.
