# Scale Model

A browser game can feel continent-sized without updating every represented person at full fidelity. The required technique is **hierarchical simulation with explicit level of detail**.

## The cardinal rule

Represent every concept at the lowest fidelity that still permits a meaningful player decision.

A village outside the player's attention may be a few aggregate numbers. The same village during a mission may have a generated tactical layout and named residents. When the mission ends, its durable consequences collapse back into aggregate state.

## Strategic hierarchy

```text
World
└── Theater
    └── Region
        └── Province
            ├── Settlement
            ├── Population cohorts
            ├── Sites
            ├── Routes
            └── Armies / parties
```

Suggested initial state counts for a full campaign target—not the first slice:

| Entity | Campaign representation |
| --- | --- |
| Provinces | Hundreds to low thousands |
| Settlements | Hundreds to several thousand |
| Population | Cohorts, not people |
| Armies | Hundreds |
| Formations | Thousands across world; only local active battles update tactically |
| Characters | Hundreds to low thousands |
| Trade flows | Route edges and commodity aggregates |
| Sites | Sparse province features |
| Visible soldiers | Thousands in an active battle, mostly render instances |

## Activity tiers

Each world entity has an activity tier.

### Tier 0 — dormant

No per-turn local process. State changes only when an external event touches it or a coarse periodic batch runs.

Examples: distant minor site, inactive character relationship.

### Tier 1 — summarized

Update once per strategic turn using aggregate formulas.

Examples: normal province economy, population change, settlement upkeep.

### Tier 2 — active

Update during relevant resolution phases with additional detail.

Examples: besieged province, moving army, faction capital under unrest.

### Tier 3 — focused

Generate high-detail transient state for a battle, mission, negotiation, or inspected city view.

Detailed transient state is discarded or archived after durable consequences are projected back.

## Update scheduling

Never loop through every entity for every system if nothing changed.

Use:

- Dirty sets for affected provinces and factions.
- Event queues ordered by `(turn, phase, priority, stableId)`.
- Sparse indices by owner, province, status, and activity tier.
- Batch processing for population, economy, supply, and visibility.
- Periodic low-frequency processes for distant state.
- Cached derived values invalidated by explicit dependencies.

## Battle hierarchy

```text
Battle
└── Side
    └── Command
        └── Formation
            └── Cohort / element
                └── Visual soldier instances
```

The formation owns:

- Order.
- Anchor and facing.
- Frontage and depth.
- Strength.
- Weapon profile.
- Armor profile.
- Morale.
- Cohesion.
- Fatigue.
- Experience.
- Terrain/contact state.
- Casualty and rout state.

A visual soldier usually owns only:

- A stable slot index.
- A local formation offset.
- A sprite frame/palette.
- Presentation animation state.
- A visibility/alive mask.

A selected hero, officer, monster, siege engine, or small skirmisher group may receive individual simulation. That is an exception with a budget.

## Soldier count versus simulation count

“10,000 soldiers on screen” must not mean “10,000 independent planners.”

A plausible battle can contain:

- 40–120 authoritative formations.
- 200–1,000 tactically special agents or elements.
- 5,000–30,000 visual soldier instances depending on hardware and sprite size.
- A lower-density representation profile for weak devices.

Casualties change formation strength. The renderer maps strength to visible occupancy, death effects, gaps, and fallback animations.

## Turn-based GPU movement

Phaser's high-throughput GPU layer is most valuable when the buffer is not rewritten every render frame. Turn-based resolution makes this possible:

1. Simulation computes formation start and end state for a resolution phase.
2. Presentation assigns soldier slots to start/end transforms.
3. GPU or presentation interpolation animates between them.
4. Buffer changes occur at phase boundaries, not for every soldier on every frame.
5. Interactive or irregular units use normal sprites or a different dynamic renderer.

Do not force one rendering primitive to handle every entity.

## World-map rendering

Do not render the campaign as millions of live tiles.

Prefer:

- Simplified province polygons for selection.
- Pre-rendered terrain chunks at several zoom levels.
- An adjacency graph for movement.
- Sparse icons and labels culled by zoom.
- Fog/ownership overlays as textures or simplified meshes.
- Province lookup via polygon index or precomputed ID map.

## Memory discipline

- Use dense numeric IDs inside hot battle loops.
- Use typed arrays for homogeneous numeric state.
- Avoid one closure, observer, component, or class instance per soldier.
- Keep definitions separate from mutable instances.
- Intern repeated strings and tags.
- Transfer compact snapshots rather than cloning the entire world.
- Measure heap before and after long sessions.
- Release scene assets and worker buffers explicitly.

## Scale gates

Do not increase content scale until the previous gate is met:

1. One province loop.
2. Small regional loop.
3. One complete battle.
4. Multiple simultaneous active operations.
5. Long campaign soak.
6. Larger regional map.
7. Multi-theater or world campaign.

Every gate needs deterministic tests, save/load, profiling, and a failure budget.
