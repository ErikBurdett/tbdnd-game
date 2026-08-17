# Technical Stack

## Renderer: Phaser 4

Phaser is the primary renderer because the project is 2D, input-heavy, scene-based, and sprite-dense. It provides the game-facing features that would otherwise need to be built around Three.js.

Use:

- WebGL-first configuration.
- Scenes for boot, map, battle, party, and diagnostics.
- Cameras for world views.
- Texture atlases and palette/tint variants.
- Normal sprites for interactive agents.
- Blitter or another dynamic batch for numerous lightweight moving images when appropriate.
- `SpriteGPULayer` for very large, mostly static or phase-interpolated populations that share a single texture.
- `TilemapGPULayer` only for suitable orthographic local maps; it is not the campaign province map.
- Render textures or generated terrain chunks for map LOD.

Do not rely on Phaser physics for formation battle authority.

### Why not Three.js first?

Three.js can render instanced quads efficiently and is excellent when the project needs a custom 3D or shader-centric renderer. It does not supply the complete 2D game framework. Starting with it would make a solo developer own more input, camera, asset, animation, scene, and debugging infrastructure.

Keep simulation and render contracts independent so a custom Three.js renderer can be added later without rewriting game rules.

## React

React owns panels, menus, tooltips, inspectors, settings, codex, save UI, and accessible controls.

React does not own:

- Tactical animation frames.
- One component per soldier.
- Authoritative simulation state mutation.
- Tight-loop canvas interaction.

Use selectors and small read models. Update the UI on meaningful state changes, not on every render tick.

## TypeScript

Use strict TypeScript for:

- Commands and events.
- Content schemas and inferred types.
- Worker message unions.
- Simulation invariants.
- Save versions.
- Renderer adapters.

Avoid type-level cleverness that obscures runtime behavior. Validate all external data even when TypeScript says it is typed.

## Zod

Use Zod at trust boundaries:

- Content JSON.
- Save files.
- Worker messages in development or at version boundaries.
- Imported asset metadata.
- Future network requests.

Do not parse validated internal objects repeatedly in hot loops.

## Workers

Campaign and battle simulations are worker candidates. Start with a campaign worker boundary even when the initial state is small.

Use:

- Transferable `ArrayBuffer`s for large snapshots.
- Explicit request IDs.
- Progress messages.
- Cancellation where a preview can become stale.
- Crash recovery and a last-known-good snapshot.

Avoid:

- Sending class instances.
- Sending entire content packs on every command.
- Depending on message arrival timing for deterministic ordering.
- Adopting SharedArrayBuffer before deployment headers and profiling are understood.

## Storage

Use IndexedDB for:

- Save blobs.
- Replays.
- User settings.
- Cached imported content.
- Benchmark history.

Dexie is an acceptable adapter when persistence is implemented. Keep the save repository interface outside simulation.

## Formatting and linting

Biome provides fast formatting and linting without coupling lint rules to the TypeScript compiler programmatic API. Keep architecture and determinism checks in tests or dedicated scripts.

## Testing

Vitest covers:

- Unit rules.
- Property/invariant tests.
- Determinism.
- Replay equivalence.
- Content validation.
- Save migrations.
- Worker contracts.
- Performance microbenchmarks where stable enough.

Browser-level scene and input tests can later use Playwright.

## Server

No server is required for the first vertical slice.

When needed, add a separate application for:

- Authentication.
- Cloud save metadata/blob storage.
- Asynchronous turn exchange.
- Matchmaking.
- Telemetry with explicit consent.
- Content distribution.

The server must submit or store commands; it must not become a second contradictory implementation of game rules.

## WASM

Do not begin with Rust/WASM. JavaScript typed arrays, data-oriented loops, workers, and renderer batching are sufficient to prove the game.

Consider WASM only when:

1. A reproducible benchmark identifies a specific CPU hot loop.
2. Algorithmic and allocation improvements are exhausted.
3. Worker parallelism is insufficient.
4. The boundary can use coarse buffers rather than chatty calls.
5. Determinism across targets is verified.
