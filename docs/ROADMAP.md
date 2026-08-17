# Development Roadmap

The roadmap is milestone-based. Calendar estimates are deliberately secondary to acceptance gates.

## Milestone 0 — Foundation

Deliver:

- Workspace installs and `pnpm check` passes.
- React + Phaser shell runs.
- Campaign worker initializes deterministic sample state.
- Strategic map and GPU benchmark scenes are accessible.
- Content and asset validation commands work.
- CI runs on a clean checkout.
- Cursor rules, skills, hooks, and agents are recognized.

Exit gate:

- Clone → install → test → dev works with documented steps.
- A second run with the same seed yields the same state hash.

## Milestone 1 — Strategic command loop

Deliver:

- Province graph.
- Faction and province state.
- Army creation/movement.
- Turn phases and command queue.
- Read models with fog-of-war filtering.
- Event log and command rejection reasons.
- Basic AI legal move.

Status (2026-08-17):

- Playable default: 4063-province 2° earth graph (84 BCE, Natural Earth 50m), faction pick, queued march / commit turn, empty occupation, contested field auto-resolve, order previews, AI legal move on commit, levy recruitment, operational fog with a visible political map, camera LOD.
- Reconstructed 84 BCE peoples: 27 playable attested states, non-playable tribal belts, and cultural regions for the Americas, interior Africa, Siberia, Australia, and the Mekong. Leftover land stays numbered (`Territory NNNN`). Do not invent later empires.
- Three-province sample world remains the unit-test fixture.
- Scripted Consular War: commander Aurelian (no password) loads a finished 22-turn Roman campaign on the earth map.
- Geography contract: `docs/ANCIENT_WORLD_84BCE.md`. Rebuild with `pnpm map:build`.
- Ten-turn same-seed replay, Aurelian campaign hash, and mid-save continuation match.
- Capital settlements and three buildings: storehouse (food), training ground (stronger levies), and civic hall (income and lower unrest). Armies cost 2 treasury upkeep each end turn.
- Planning queue is live: `army.move` queues, `order.cancel` withdraws, commit turn resolves player orders then AI and economy (ADR-0007).
- Still open: queueing recruit/buildings in the same commit pass.

Exit gate:

- Player and AI can complete ten deterministic turns.
- Replay equivalence test passes.

## Milestone 2 — Settlement and economy

Deliver:

- Settlement queues.
- Population/resource aggregates.
- Recruitment and upkeep.
- Supply generation/consumption.
- Three building chains.
- Four research branches.
- Tooltips with causal breakdowns.

Status (2026-08-17):

- Economy step is live: capital settlements, storehouse, training ground, civic hall, harvest bonus, army and building upkeep.
- Large-map harvest skips unorganized land and does not emit one event per cell.
- Large-map victory requires about 40% of attested homeland, not cultural regions or a flat 24-province count.
- 100-turn soak on the sample world preserves invariants.
- Research is live: Organized Logistics starts known; Composite Bow Doctrine and Ritual Astronomy can be queued. Still open: population cohorts, supply, an arcane building, the remaining research branches.

Exit gate:

- Choices create visible tradeoffs.
- No full-world scan is required for every formula.
- A 100-turn soak preserves invariants.

## Milestone 3 — Operational armies

Deliver:

- Formations, commanders, movement posture, scouting, fatigue, supply.
- Interception and battle initiation.
- Army inspector and order preview.
- AI goal and utility skeleton.

Exit gate:

- Army state persists through movement and battle handoff.
- Invalid compositions/orders are explained.

## Milestone 4 — Formation battle

Deliver:

- Battle worker and phase state.
- Deployment.
- Formation movement/contact.
- Morale, cohesion, fatigue, casualties, rout, reserves, withdrawal.
- Renderer adapter and density profiles.
- Performance benchmark with recorded results.

Exit gate:

- One complete battle resolves deterministically.
- Visual density does not alter results.
- Outcome projects back to campaign.

## Milestone 5 — Party mission

Deliver:

- Compact tactical map.
- Individual characters and actions.
- Objective/extraction.
- One arcane mechanic.
- Campaign consequences.

Exit gate:

- Mission uses shared world characters and produces a domain event bundle.
- Save/reload works during allowed mission boundaries.

## Milestone 6 — Save, replay, and diagnostics

Deliver:

- IndexedDB save repository.
- Save migrations.
- Periodic replay checkpoints.
- Replay inspector.
- State hash and phase timing diagnostics.
- Crash recovery.

Exit gate:

- Version N-1 fixture migrates.
- Corrupt save fails safely.
- Desync can be localized to a command/phase.

## Milestone 7 — Content and usability pass

Deliver:

- Finer 84 BCE borders and named regions on the earth pack (attested states, tribal belts, and cultural regions are in on the 2° / 50m pack; surveyed coasts and 1° Mediterranean detail remain).
- Initial theater data with provenance.
- Sorceress asset pipeline.
- Onboarding.
- Accessibility baseline.
- Audio and presentation polish.
- Balance telemetry stored locally or explicitly opted in.

Exit gate:

- A new player completes the loop without developer intervention.
- All third-party assets have rights records.
- Historical/fantasy labels are consistent.

## Milestone 8 — Scale proof

Deliver:

- Larger synthetic world fixture.
- Long campaign soak.
- Memory profile.
- Multiple simultaneous battles resolved serially or in bounded workers.
- Province map LOD (camera far/mid/near is live on the earth pack; texture LODs remain).
- AI budget tests.

Exit gate:

- Target synthetic counts remain within agreed turn, memory, save, and frame budgets.
- Scale is expanded only after bottlenecks are understood.

## Deferred branches

Backend, cloud saves, multiplayer, mod SDK, and WASM optimization begin as independent ADR-backed branches only after Milestone 6.
