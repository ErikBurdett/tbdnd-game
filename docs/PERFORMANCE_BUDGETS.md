# Performance Budgets

Performance is a product requirement and must be tracked with scenes and simulation fixtures, not intuition.

## Reference profiles

### Desktop reference

- 1920×1080.
- WebGL 2.
- 60 Hz.
- Hardware recorded in each benchmark result.
- Default visual density: 10,000 rank-and-file instances in the renderer benchmark.

### Desktop minimum

- 1366×768.
- Older integrated GPU.
- 30 FPS acceptable during dense presentation.
- Reduced particles, shadows, animation rate, and soldier density.

### Mobile experimental

- Reduced map labels and effects.
- 2,000 or fewer battle visual instances until measured.
- No promise of parity with desktop.
- Touch and accessibility work must precede release claims.

## Frame budgets

At 60 FPS the total frame budget is 16.7 ms.

Initial target allocation:

| Work | Median budget |
| --- | ---: |
| Browser/React/layout | 2.0 ms |
| Phaser scene update/input | 2.0 ms |
| Render submission | 4.0 ms |
| GPU render | 6.0 ms |
| Headroom/variance | 2.7 ms |

The authoritative simulation should not consume the main-thread frame budget.

## Main-thread rules

- No routine task above 50 ms.
- Chunk large parsing and import work.
- Do not rebuild province geometry in response to ordinary selection.
- Do not update React from a per-frame Phaser callback.
- Avoid allocating arrays/objects in hot render loops.
- Use object pools only where measurement shows churn.
- Prefer stable typed buffers for repeated snapshots.

## Strategic simulation budgets

For the vertical slice:

- Single command validation: under 2 ms median in worker.
- Turn resolution: under 100 ms total target, with progress/chunk design ready for larger worlds.
- State hash: under 10 ms.
- Snapshot serialization: under 25 ms.
- Save write: UI remains responsive.

For larger campaigns, total turn time may grow, but every phase must be instrumented and cancellable previews must not block authoritative resolution.

## Battle budgets

Separate:

1. **Authoritative resolution cost.**
2. **Snapshot extraction cost.**
3. **Presentation interpolation cost.**
4. **GPU fill and draw cost.**

Initial gates:

- 100 formations resolve one tactical phase within 20 ms in a worker on the reference machine.
- 10,000 small visible instances maintain 60 FPS median in the benchmark scene.
- No per-soldier pathfinding or collision solver.
- Renderer snapshot size and update frequency are logged.
- Visual density can be lowered without changing authoritative results.

## Asset budgets

Provisional first-load budget for the vertical slice:

| Category | Compressed target |
| --- | ---: |
| JavaScript initial route | 1.5 MB |
| Core map textures/data | 4 MB |
| Essential UI/font assets | 1 MB |
| First battle unit atlases | 8 MB |
| Audio essential | 4 MB |
| Total first playable | 20 MB |

Load nonessential content on demand. These targets should be revised from real network and device testing.

## Save budgets

- Small vertical-slice save: below 2 MB compressed.
- Full-campaign target: below 25 MB compressed unless evidence justifies more.
- Autosave writes are debounced and atomic at the repository layer.
- Replays may be larger but should use compact command encoding and periodic checkpoints.

## Regression policy

A performance-affecting pull request must include:

- The benchmark or fixture used.
- Before/after measurements.
- Hardware/browser.
- Entity and viewport counts.
- Whether the result is CPU, GPU, memory, or transfer limited.
- Any quality tradeoff.

A regression above 10% in a stable benchmark requires explanation and explicit acceptance.
