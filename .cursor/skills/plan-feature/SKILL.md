---
name: plan-feature
description: Plan a bounded multi-file game feature before implementation. Use for new systems, scenes, commands, schemas, worker flows, save changes, or work that crosses packages.
disable-model-invocation: false
---

# Plan Feature

Produce a reviewable plan. Do not edit until the plan is accepted unless the user explicitly asks for immediate implementation.

## Workflow

1. Read:
   - `PROJECT_CONFIG.md`
   - `docs/ARCHITECTURE.md`
   - Relevant ADRs
   - Nearest package source/tests/README
2. Restate the user-visible outcome in one paragraph.
3. Define acceptance criteria as observable behavior.
4. Define non-goals to prevent scope expansion.
5. Search for existing commands, events, schemas, utilities, and tests to reuse.
6. Draw the data flow:
   `input → command → validation → state transition → events → read model → renderer/UI`.
7. Identify:
   - Package/file ownership.
   - Determinism and RNG effects.
   - Numeric units and ordering.
   - Worker/transfer effects.
   - Content/save schema effects and migrations.
   - Performance counts/budgets.
   - Accessibility surface.
8. Split work into the smallest end-to-end increments. Each increment must compile and test.
9. Name exact tests and benchmark fixtures.
10. State whether an ADR is needed.
11. End with the commands that prove completion.

Use `references/PLAN_TEMPLATE.md` as the output shape.
