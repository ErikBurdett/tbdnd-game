---
name: add-formation-battle-feature
description: Add a formation-level battle rule or order with deterministic phase resolution, renderer events, campaign consequences, and density-invariant tests.
paths:
  - "packages/battle-sim/**/*.ts"
  - "apps/client/src/game/scenes/Battle*.ts"
disable-model-invocation: false
---

# Add Formation Battle Feature

Read `docs/BATTLE_MODEL.md`.

## Specify

- Tactical decision.
- Formation fields read/written.
- Phase and stable order.
- Footprint/contact implications.
- RNG stream if any.
- Morale/cohesion/fatigue/casualty interaction.
- Events required for presentation.
- Campaign outcome effect.
- AI doctrine/utility effect.
- Visual-density independence.

## Tests

- Formation rule in isolation.
- Symmetric stable tie.
- Edge/contact case.
- Routed/destroyed/withdrawn state.
- Same seed and replay.
- Two visual density profiles yield identical authority.
- Target-count phase benchmark when algorithmic.
