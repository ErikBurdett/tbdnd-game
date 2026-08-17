# Project Configuration and Design Defaults

Edit this file before broad implementation. Cursor agents must treat the values here as the current product decisions unless a later ADR supersedes them.

## Identity

| Field | Default |
| --- | --- |
| Working title | Imperium Arcana |
| Genre | Turn-based historical-fantasy grand strategy with formation and party tactics |
| Starting date | 84 BCE |
| Initial theater | Entire earth; reconstructed late-Republic political layer |
| Art direction | Readable 2D pixel art, restrained ancient palette, original fantasy motifs |
| Camera | Top-down or elevated orthographic; no required 3D world |
| Target | Modern desktop Chromium/Firefox/Safari; reduced-density mobile later |

## Product defaults

| Question | Decision |
| --- | --- |
| First mode | Single-player, offline-first |
| Strategic turn | One month |
| Strategic resolution | Planning → commit → deterministic resolution → aftermath |
| Formation battle | WEGO phases; formation authority with soldier visual instances |
| Party combat | Individual turn-based actions on a compact grid or nav graph |
| Magic level | Rare but strategically consequential; visibly divergent from history |
| Map topology | Province polygons + adjacency graph; local tactical maps are separate |
| Content approach | Data-driven JSON validated by Zod |
| Save approach | Versioned snapshot + command tail + state hash |
| AI | Utility scoring + goal planning; strict per-turn budgets |
| Multiplayer | Deferred; preserve deterministic command interface |
| Backend | Deferred until local vertical slice is stable |
| Modding | Data-pack friendly from the start; public mod SDK later |
| Monetization | Undecided; do not add monetization code |

## Initial vertical-slice scope

- Default playable map: full-earth 84 BCE pack (see `docs/ANCIENT_WORLD_84BCE.md`).
- Content-catalog schematic theater still used for citations: 6 factions, 7 provinces.
- 4–6 settlements.
- 8–12 unit definitions.
- 3 building chains.
- 4 compact research branches: military, civic, culture, arcane.
- One recruit/move/supply/battle loop.
- One party mission.
- One AI opponent capable of completing the loop.
- One save slot and one deterministic replay inspector.
- A benchmark scene with 10,000 visible rank-and-file instances on the reference desktop profile.
- A real battle scenario with a smaller authoritative formation count and scalable visual density.

## Reference performance profile

Record the actual machine in benchmark output. Initial reference assumptions:

- 1920×1080 viewport.
- Dedicated or modern integrated GPU with WebGL 2.
- 60 Hz display.
- Render frame median under 16.7 ms.
- 1% low above 30 FPS in the benchmark.
- Strategic turn resolution divided into work chunks so the UI remains responsive.
- Main-thread long tasks above 50 ms are failures unless explicitly acknowledged by a benchmark.

These are budgets to test, not guaranteed hardware claims.

## Decisions still open but non-blocking

Record changes through an ADR rather than repeatedly relitigating them:

1. Square, hex, or free-nav tactical party maps.
2. Exact world-turn duration after the vertical slice.
3. Whether formation battles remain pure WEGO or gain an optional pausable continuous-resolution presentation.
4. ~~The first historically focused theater.~~ Decided: entire earth, 84 BCE (`docs/ANCIENT_WORLD_84BCE.md`).
5. The names and intensity of magic traditions.
6. Whether player characters can lead armies directly.
7. Finer than the current 2° earth pack (1° Mediterranean / surveyed coasts).
8. Mod packaging and scripting language.
9. Cloud-save provider.
10. Accessibility targets beyond the baseline in `docs/ACCESSIBILITY.md`.

Until changed, agents should use the defaults above and keep interfaces replaceable.
