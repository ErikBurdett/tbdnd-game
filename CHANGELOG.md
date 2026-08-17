# Changelog

## Unreleased

- Demo campaigns start without an account; saving from the in-game menu creates a local commander.
- Marching into empty foreign land captures it. Guarded land fights a deterministic field battle.
- AI factions take one legal march on end turn when they can reclaim empty player land without attacking a stronger army.
- Campaign inspector shows march/attack previews and hides harvest noise from the event list.
- Raise a levy on empty owned land for 80 treasury.
- Fog of war hides the eastern march and its host until the river is held.
- Reviewer commander Aurelian (no password) loads the finished Consular War from the hall.
- Default campaign map is a 4063-province 2° earth graph for 84 BCE, built from Natural Earth 50m land. Players pick an ancient faction; Aurelian plays as Rome.
- The strategic map uses zoom LOD: far view merges peoples, near view draws every territory and numbered land.
- Marches are queued in planning and resolve when the turn is committed. Cancel withdraws an order.
- Map labels no longer stack while panning or zooming. Numbered land waits for a close zoom; the wheel zooms toward the cursor.
- Map navigation: smooth wheel zoom, WASD/arrow pan, +/− zoom, double-click zoom in, H/Recenter on the player capital. The side panel keeps Commit turn at the top.
- Political owners stay visible on the earth map. Fog still hides foreign armies, food, and unrest.
- 84 BCE peoples expanded to 27 playable attested states (including Dacia, Bithynia, Cappadocia, Caucasian Iberia, Noricum, Yuezhi, Pandya, Anuradhapura, Saba, and Garamantes). Cultural regions cover land without a recorded state; leftover cells stay numbered. Victory and harvest ignore undeveloped cultural land.
- AI reclaims empty captured land but does not walk through a player's homeland.
- Capital settlements can queue a storehouse, training ground, or civic hall. The hall pays 2 treasury a turn and lowers unrest. Trained levies are stronger; a training ground costs 1 treasury each turn. Armies cost 2 treasury upkeep each turn.
- Factions can queue research. Organized Logistics starts known. Composite Bow Doctrine strengthens levies; Ritual Astronomy adds harvest food.

## 0.1.0 — 2026-08-16

- Initial Cursor development kit.
- Phaser/React vertical-slice scaffold.
- Deterministic strategic and typed-array battle packages.
- Rules, skills, focused subagents, hooks, prompts, CI, and documentation.

## 2026-08-16 — packaged starter kit

- Added the runnable React/Phaser client scaffold, deterministic campaign simulation, typed-array formation battle primitives, sample content, asset manifest tooling, and a 10,000-instance benchmark scene.
- Added Cursor project rules, 14 Agent Skills, three focused subagents, an edit-formatting hook, and reusable implementation/review prompts.
- Added Windows and POSIX bootstrap scripts, editor recommendations, benchmark result templates, Dependabot, a PR completion checklist, and current GitHub Actions setup.
- Added explicit validation reporting and first-install lockfile guidance.
- Completed dependency-free structure, content, asset, architecture, strict simulation-source, syntax-transpile, YAML, shell, and pure-simulation smoke checks; documented all environment-limited checks in `VALIDATION_REPORT.md`.
