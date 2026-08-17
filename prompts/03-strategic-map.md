# Strategic Map Feature Prompt

We need the next bounded strategic-map capability. Use `/plan-feature`.

Read `docs/STRATEGIC_MAP_PIPELINE.md`, `docs/SCALE_MODEL.md`, and existing map/read-model code.

The map is a province graph, not an authoritative tile grid.

Required constraints:

- Simulation movement uses province edges and explicit costs.
- Renderer uses IDs, simplified geometry, prepared chunks, and zoom-aware culling.
- Selection returns a province ID only.
- Fog-of-war filtering occurs before presentation.
- React receives a compact province inspector.
- No real historical boundary is added without provenance metadata.
- No runtime GIS transformation.
- No rebuild of province geometry on ordinary selection.

Plan one feature such as province selection, adjacency move preview, route overlay, or fog overlay. Include map topology tests and a rendering count budget. Implement only after plan review.
