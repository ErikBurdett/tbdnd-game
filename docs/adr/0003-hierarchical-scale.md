# ADR-0003: Scale is hierarchical and formation-authoritative

- Status: accepted
- Date: 2026-08-16

## Context

The desired campaign is continent-scale and battles may show thousands of soldiers. Full individual simulation for every represented person is not feasible or necessary for meaningful decisions.

## Decision

Use explicit levels of detail. World entities update by activity tier. Population is cohort-based. Armies aggregate formations. Formations own battle authority; most soldiers are visual instances. Party encounters use individual simulation because counts are small.

## Consequences

- Large visual and campaign scale becomes tractable.
- Some players may assume each visible soldier is fully autonomous; UI and effects must remain convincing.
- Projection between high-detail encounters and campaign aggregates is a first-class design problem.

## Verification

- Battle results are invariant under visual-density changes.
- No per-soldier AI/physics in scale scenes.
- Synthetic scale fixtures meet budgets.
