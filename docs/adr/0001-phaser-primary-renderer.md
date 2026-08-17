# ADR-0001: Phaser 4 is the primary renderer

- Status: accepted
- Date: 2026-08-16

## Context

The game is a browser-first 2D pixel strategy game with campaign maps, tactical scenes, input, cameras, animation, audio, and large sprite populations. The initial choice was Phaser or Three.js.

## Decision

Use Phaser 4 in WebGL mode as the primary renderer. React owns application UI. Renderer-independent contracts prevent Phaser from entering authoritative simulation packages.

Use specialized primitives by update pattern:

- Normal sprites for interactive/special units.
- `SpriteGPULayer` for extremely numerous objects sharing one texture when data changes mainly in batches/phase boundaries.
- Blitter or custom batching for dynamic lightweight populations when appropriate.
- Render textures/chunks for the campaign map.

## Consequences

Benefits:

- Less bespoke engine infrastructure.
- Native 2D game abstractions.
- Current GPU-oriented renderer features.
- Faster vertical-slice delivery.

Costs:

- Phaser-specific renderer adapters.
- `SpriteGPULayer` constraints around texture and buffer changes.
- A future custom renderer requires a new adapter.

## Alternatives considered

### Three.js first

Rejected for the first implementation. It offers excellent low-level rendering and instancing but would require more 2D game framework work.

### Canvas 2D

Rejected as the primary scale path. It may remain a fallback for limited tools.

## Verification

- Browser scaffold runs Phaser in WebGL.
- Simulation packages have no Phaser dependency.
- Renderer benchmark records density and frame time.
