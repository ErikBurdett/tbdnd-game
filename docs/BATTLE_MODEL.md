# Formation Battle Model

## Design objective

Display the apparent scale of a Total War battle while retaining turn-based authority, browser performance, and readable decisions.

The battle is not an individual-agent melee simulator. It is a command-and-formation simulation with soldier-level presentation.

## Tactical cycle

Initial WEGO cycle:

```text
observe → issue orders → lock orders → resolve movement/contact →
resolve attacks/morale → reactions → aftermath → next phase
```

Presentation may animate the resolution over several seconds. The result is already determined by the battle worker.

## Formation state

Recommended authoritative fields:

- Campaign formation ID and dense battle ID.
- Side and command group.
- Unit definition.
- Strength and frontage.
- Anchor position and facing.
- Formation depth/shape.
- Order and target.
- Speed.
- Weapon reach/range.
- Attack/defense/armor profiles.
- Cohesion.
- Morale.
- Fatigue.
- Experience/discipline.
- Terrain and elevation.
- Flank/rear exposure.
- Contact set.
- Casualties and disabled equipment.
- Routed/withdrawing/destroyed flags.
- Commander influence.

## Spatial model

Start with continuous fixed-point 2D anchors and formation footprints.

Use:

- Uniform spatial hash or grid.
- Simplified convex/rectangular footprints.
- Swept broad-phase checks between phase endpoints.
- Contact graph at formation level.
- Deterministic conflict resolution when destinations overlap.
- Terrain zones or sampled cost field.

Do not start with navmeshes, rigid-body physics, or per-soldier collision.

## Movement

Orders produce desired endpoints and facing. Resolution accounts for:

- Terrain movement cost.
- Formation type and current shape.
- Cohesion and fatigue.
- Enemy zones of control/contact.
- Friendly obstruction.
- Command delay if enabled.
- Charge/withdrawal/rout state.

When two formations contest space, use explicit priority and fallback rules.

## Combat

A starting model can resolve by contact segments:

1. Determine engaged frontage.
2. Determine attack opportunities from weapon/reach/doctrine.
3. Apply attack quality, defender posture, armor, terrain, flank, fatigue, and cohesion.
4. Produce casualties and cohesion pressure.
5. Apply morale shock from losses, flank, commander, allies routing, and special effects.
6. Transition state.

Avoid a single opaque “combat strength” formula. Emit breakdown components for inspection and balance tests.

## Ranged combat

Track:

- Range bands.
- Line of sight/terrain obstruction.
- Ammunition.
- Formation density.
- Movement penalty.
- Target exposure.
- Friendly-fire policy where relevant.
- Suppression/cohesion pressure distinct from casualties.

Projectiles are presentation unless a small set of tactically important missiles needs discrete simulation.

## Morale and rout

Morale should create state transitions, not simply another health bar:

```text
steady → shaken → wavering → routing → rallied or broken
```

Inputs may include:

- Recent casualty ratio.
- Cohesion.
- Fatigue.
- Flank/rear threat.
- Commander presence.
- Neighbor states.
- Encirclement/escape route.
- Unit discipline and doctrine.
- Supernatural effects.

Routed formations choose deterministic escape goals and lose player control until rallied.

## Characters and exceptional units

Heroes, commanders, monsters, chariots, artillery/siege engines, and small skirmisher groups may use individual or element-level records.

Each exception consumes a performance/design budget. It must still connect to formations and command.

## Visual mapping

Renderer adapter maps formation state to soldiers:

- Stable slot layout generated from formation shape.
- Occupancy proportional to current strength.
- Slot jitter derived from a presentation-only seed.
- Palette/frame from unit/faction definitions.
- Start/end transforms for phase animation.
- Selected formation outline and order arrows as normal interactive objects.
- Casualty effects pooled and capped.
- Lower density on weaker devices without altering formation state.

### Phaser renderer selection

Use:

- `SpriteGPULayer` for large populations sharing one texture and changing mainly at phase boundaries.
- Normal sprites for selected/interactive/special units.
- Blitter or a custom batched renderer for dynamic lightweight visuals when buffer update behavior is a better fit.
- Graphics/render textures for order overlays and terrain decorations.
- One layer per compatible texture/material batch, not one per formation.

Profile actual update patterns. A one-draw-call renderer can still be slow when fill rate or buffer rebuilds dominate.

## Battle outcome handoff

Battle produces a campaign consequence bundle:

- Formation strength/equipment/fatigue/morale/experience changes.
- Character injuries/deaths/captures.
- Supply/loot.
- Winner, withdrawal route, and pursuit.
- Province control or siege changes.
- Reputation/legitimacy/events.
- Persistent battle history.

Campaign applies the bundle through a validated command/event boundary, not direct mutation by the Phaser scene.
