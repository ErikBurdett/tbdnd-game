---
name: add-strategic-system
description: Add a province, settlement, army, economy, research, diplomacy, exploration, or population system to the campaign turn pipeline as a sparse deterministic vertical slice.
paths:
  - "packages/sim-core/**/*.ts"
  - "packages/game-data/**/*.ts"
  - "apps/client/src/**/*.tsx"
disable-model-invocation: false
---

# Add Strategic System

Use `/plan-feature` first.

## Required design

- Player decision and counterplay.
- Command(s) and validation.
- Exact turn phase.
- State and indices touched.
- Dirty/activity-tier scheduling.
- Numeric units and modifier breakdown.
- AI observation and legal action.
- Fog-of-war exposure.
- Events and read model.
- Save/content changes.
- 10/100-turn fixture.

## Scope

Implement one playable decision, not an entire grand-strategy domain.

Example acceptable slice:

> A settlement can queue one road building, pay its cost, progress during construction,
> complete deterministically, modify one route edge, show the breakdown, and allow the AI
> to make the same legal choice.

Avoid a generic “modifier engine” until at least two concrete systems demonstrate the needed abstraction.
