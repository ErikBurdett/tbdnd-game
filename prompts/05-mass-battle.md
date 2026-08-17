# Formation Battle Prompt

Use `/plan-feature`, then `/add-formation-battle-feature`.

The desired spectacle is thousands of soldiers, but formation state is authoritative.

For the next feature, define:

- The tactical decision.
- Formation fields and fixed units.
- Resolution phase and stable order.
- Spatial/contact model.
- Morale/cohesion/fatigue consequences.
- Domain events needed for phase animation.
- Campaign consequence.
- AI doctrine behavior.
- Visual mapping at low and high density.
- Performance fixture.

Renderer rules:

- Selected formations, officers, and order handles may use normal sprites.
- Large one-texture rank-and-file populations may use `SpriteGPULayer` when positions are populated or patched in batches at phase boundaries.
- Do not rewrite thousands of GPU members every render frame without profiling.
- Do not add physics/pathfinding to soldier sprites.
- Density changes visuals only.

A first battle feature should be something bounded, such as deploy/move, frontage contact, ranged volley, morale/rout, or reserve commitment. It must be deterministic and inspectable.
