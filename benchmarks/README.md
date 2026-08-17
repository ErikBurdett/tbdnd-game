# Performance Benchmarks

Performance is a compatibility contract, not an impression. Record results whenever a change affects rendering density, simulation entity counts, worker transfer volume, pathfinding, visibility, AI budgets, or asset memory.

## Large-unit renderer benchmark

1. Run `pnpm dev`.
2. Open the app in a production-target browser with developer tools closed.
3. Press `B` to open `BattleBenchmarkScene`.
4. Let the scene settle, then record at least 30 seconds.
5. Test the reference viewport and at least one reduced-density profile.
6. Save a copy of `result-template.json` under `benchmarks/results/YYYY-MM-DD-machine-slug.json`.

The included scene derives 10,000 visual slots from four authoritative formations. It is a static population stress test, not proof that a complete battle with animation, effects, UI, fog, and simulation will meet the same frame time.

## Required metadata

Record:

- Commit SHA and dirty status.
- Browser/version, OS, CPU, GPU, RAM, viewport, device pixel ratio, and power mode.
- Scenario ID and authoritative versus visual entity counts.
- Median frame time, p95 frame time, 1% low FPS, main-thread long tasks, JS heap, and GPU/texture notes when available.
- Whether buffers were rebuilt, partially edited, or left static.
- Quality and visual-density settings.
- A concise conclusion against `docs/PERFORMANCE_BUDGETS.md`.

Do not compare results from materially different machines as though they were a regression test. Preserve one reference machine/profile and compare the same scenario there.
