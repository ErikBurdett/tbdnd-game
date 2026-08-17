# Performance Audit Prompt

Invoke `/performance-pass`.

Do not optimize from code aesthetics.

Define a reproducible case and collect baseline data for:

- Browser/hardware/viewport.
- Entity and visible instance counts.
- Quality/density.
- Median and tail frame time.
- Worker simulation phase time.
- Snapshot/transfer bytes and time.
- Heap before/after scene transitions.
- Draw calls/buffer updates/fill symptoms when measurable.

Classify the bottleneck before changing code. Preserve deterministic hashes for rule-neutral optimizations.

Provide a before/after table and retain a benchmark fixture so the regression can be detected.
