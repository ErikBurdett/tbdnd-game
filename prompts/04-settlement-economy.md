# Settlement and Economy Prompt

Add one complete settlement/economy decision—not a generic all-purpose economy framework.

Use `/add-strategic-system`.

Candidate bounded outcome:

> The player queues a road or granary, sees exact cost and completion estimate, commits
> the order, pays resources, advances construction in the construction phase, receives a
> completion event, and sees the resulting route/storage modifier breakdown.

Acceptance requirements:

- Stable content definition and Zod validation.
- Command with expected revision and structured rejection.
- Integer currency/resources/progress.
- Explicit construction phase.
- No full-world scan; update the affected settlement/province/edge.
- AI can issue the same legal command or has a deterministic fallback.
- Read model explains every cost/modifier.
- Save/replay compatibility assessed.
- Happy, insufficient-resource, duplicate/blocked, completion, same-seed, and load-continuation tests.
- Ten-turn scenario fixture.

Do not build markets, trade, population, taxation, and construction simultaneously.
