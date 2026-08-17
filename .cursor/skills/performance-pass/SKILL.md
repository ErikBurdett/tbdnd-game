---
name: performance-pass
description: Profile and improve a named simulation/rendering/loading bottleneck against explicit counts and budgets without changing authoritative behavior.
disable-model-invocation: true
---

# Performance Pass

Read `docs/PERFORMANCE_BUDGETS.md`.

## Define the benchmark

Record:

- Scenario/fixture.
- Entity/instance count.
- Viewport and zoom.
- Browser and hardware.
- Quality profile.
- Warmup and sample duration.
- Metric: median, p95/p99, 1% low, heap, bytes, turn time, transfer time.

## Diagnose before changing

Determine whether the bottleneck is:

- Algorithmic complexity.
- Allocation/GC.
- Main-thread work.
- Worker transfer/serialization.
- Draw calls.
- GPU buffer rebuild.
- Fill rate/overdraw.
- Texture switching.
- React render/layout.
- Asset/network/decompression.
- Memory retention.

Use profiler evidence, counters, or a controlled A/B—not guesswork.

## Optimize in order

1. Remove unnecessary work.
2. Reduce frequency/activity tier.
3. Improve algorithm/index.
4. Improve data layout/allocation.
5. Batch/cull/LOD.
6. Move coarse work to worker.
7. Change renderer primitive.
8. Consider WASM only after all above and with an ADR.

## Correctness guard

- Visual density must not change battle outcomes.
- Preserve same-seed hashes for rule-neutral optimization.
- If formula behavior changes, treat it as a gameplay change with versioning.
- Add a regression benchmark or operation-count test.

## Output

Provide before/after table, percent change, measurement caveats, correctness test, and remaining bottleneck.
