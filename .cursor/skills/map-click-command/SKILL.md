---
name: map-click-command
description: >-
  Implement Total War-style strategic map interaction: click provinces, armies,
  and settlements to select and issue orders. Use when adding map picking, army
  movement from the map, selection chrome, campaign map UX, or inspector panels
  driven by map selection.
paths:
  - "apps/client/src/map/**/*.ts"
  - "apps/client/src/game/scenes/StrategicMapScene.ts"
  - "apps/client/src/game/bridge.ts"
  - "apps/client/src/App.tsx"
  - "apps/client/src/components/**/*.tsx"
disable-model-invocation: false
---

# Map Click Command

Players manage the empire by clicking map elements. Panels are inspectors and
keyboard equivalents, not the primary way to issue orders.

## Interaction model

| Input | Result |
| --- | --- |
| Left-click army / settlement / province | Select that ID |
| Left-click highlighted legal destination | Issue the pending order (usually `army.move`) |
| Right-click destination with a player army selected | Issue move; show the simulation rejection if illegal |
| Click empty map or press Escape | Clear selection |
| Keyboard list / button with the same ID | Same selection and same command as the click |

Do not invent a second order path that bypasses these IDs.

## Data flow

```text
Phaser pick → resolveMapPick → optional command → worker
                ↓
         React selection
                ↓
      compact StrategicMapView → Phaser chrome
```

- Phaser emits `{ kind, id, button }` picks only. It does not decide legality.
- `resolveMapPick` is a pure function. Phaser and React both consume its result.
- `sim-core` is the only authority for movement, ownership, and phase.
- Legal destinations come from the read model (`legalDestinationIds`), never from scene geometry.
- React never updates on a render frame. Publish a map view when the read model or selection changes.

## Implementation rules

- One selection: `{ kind: "none" } | { kind: "province" | "army" | "settlement", id }`.
- Interactive objects (armies, settlements, selected markers) are normal Phaser Game Objects.
- Province fills, army banners, and highlights are presentations of the read model.
- Army markers follow `army.provinceId`. Stack markers in the same province with a stable ID sort.
- Disable the browser context menu on the canvas so right-click can order.
- Clean pick listeners on scene shutdown.
- Keep keyboard lists in React with the same IDs and visible focus.

## When adding a new map entity

1. Give it a stable content/instance ID.
2. Add pick kind + selection kind.
3. Extend `resolveMapPick` with tests.
4. Put legal actions on the read model.
5. Render a marker from the view; do not hardcode positions after the first geometry pass.
6. Add a React inspector row/button that selects the same ID.

## Non-goals

- Per-soldier map tokens.
- Authoritative pathfinding or adjacency inside the scene.
- Hover-only tooltips with no focus equivalent.
- Context menus that hide commands the map click cannot issue.
