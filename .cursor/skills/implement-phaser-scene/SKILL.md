---
name: implement-phaser-scene
description: Build or modify a Phaser scene or renderer adapter while preserving simulation authority, lifecycle cleanup, pixel rendering, accessibility bridge, and measurable scale.
paths:
  - "apps/client/src/game/**/*.ts"
  - "apps/client/src/game/**/*.tsx"
disable-model-invocation: false
---

# Implement Phaser Scene

Read `docs/ARCHITECTURE.md`, `docs/PERFORMANCE_BUDGETS.md`, and the snapshot/event contract.

## Before coding

Specify:

- Scene purpose and entry/exit.
- Authoritative data consumed.
- Semantic inputs emitted.
- Interactive versus mass-rendered objects.
- Expected object/instance count.
- Renderer primitive for each population.
- Lifecycle cleanup.
- Reduced-density behavior.

## Rendering selection

- Normal sprites: interactive, selected, special, irregular.
- `SpriteGPULayer`: one texture, huge population, batched/infrequent member updates.
- Blitter/batched alternative: lightweight objects with more frequent movement.
- Graphics/render texture: overlays, generated texture, mostly static layers.
- React: semantic panels and accessible control lists.

Do not force `SpriteGPULayer` into a per-frame buffer rewrite pattern.

## Implementation

- Keep rules out of the scene.
- Use IDs to connect presentation to read models.
- Make interpolation presentation-only.
- Avoid per-frame allocations.
- Cull by camera and zoom.
- Never update React on each frame.
- Clean all listeners/timers/resources.
- Add WebGL-unavailable messaging where relevant.
- Expose keyboard-equivalent semantic controls.

## Verification

- Scene transition works repeatedly without duplicated listeners.
- Density setting changes visuals only.
- Benchmark records count/frame timing for scale work.
- Typecheck/build passes.
