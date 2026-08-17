# Cursor Operating Manual

## Why this repository has rules, skills, and subagents

- **Rules** are persistent architecture and file-specific constraints.
- **Skills** are repeatable workflows loaded when relevant or invoked with `/`.
- **Subagents** isolate expensive specialist analysis. There are only three because broad fleets of vague agents add cost and confusion.
- **Hooks** format edited source/config files and can later add architecture guards.
- **Prompts** are reusable task briefs for major milestones and templates.

## Session discipline

Start a new chat when:

- Moving to a different feature.
- Finishing one logical unit.
- The agent repeats mistakes.
- Context is long enough that irrelevant details dominate.

Continue a chat when:

- Iterating on the same acceptance criteria.
- Debugging what the agent just implemented.
- Reviewing the same plan/diff.

## Plan mode

Use Plan mode for work that:

- Changes more than one package.
- Adds a save/content schema.
- Changes simulation order or formulas.
- Adds a new scene/system.
- Affects performance budgets.
- Needs migration or ADR work.

A good plan names:

- Outcome and non-goals.
- Existing contracts to reuse.
- Files/packages likely to change.
- Data flow.
- Determinism and compatibility effects.
- Tests.
- Profiling.
- Rollback or migration.
- Completion commands.

Do not accept a plan that says “implement the system” without slices.

## Recommended chat lifecycle

### 1. Orient

Prompt:

```text
Read PROJECT_CONFIG.md, docs/ARCHITECTURE.md, the relevant ADRs, and the nearest
package README. Summarize the existing contract and identify the smallest end-to-end
change that satisfies the requested outcome. Do not edit yet.
```

### 2. Plan

Invoke `/plan-feature` or paste `prompts/templates/feature.md`.

### 3. Implement

Ask for one bounded acceptance group. Agents should modify code and tests together.

### 4. Verify

Invoke the `verifier` subagent or `/release-check` for a milestone. Require actual command output.

### 5. Commit

Review the diff. Commit one logical unit with an intentional message. Use a fresh chat for the next feature.

## Subagents

### `architect`

Use for:

- Cross-package design.
- ADR proposals.
- Save/content compatibility.
- Dependency boundary review.

It should analyze, not become the default coder.

### `simulation-engineer`

Use for:

- Determinism.
- Data-oriented layout.
- Algorithms and invariants.
- AI/simulation performance.
- Replay mismatch.

### `verifier`

Use after implementation for:

- Acceptance criteria.
- Tests/checks.
- Boundary violations.
- Unhandled edge cases.
- Documentation drift.

## Parallel work

Use isolated Git worktrees/branches for truly independent tasks. Good pairs:

- UI panel and independent content definitions.
- Benchmark harness and unrelated documentation.
- Asset importer and map tooling.

Bad parallelization:

- Two agents editing the same core reducer.
- Schema and migration implemented independently.
- Renderer adapter and its still-changing snapshot contract.

Merge contracts before parallel implementations.

## Prompt style

A strong prompt includes:

- User-visible outcome.
- Current behavior.
- Acceptance criteria.
- Non-goals.
- Constraints.
- Relevant files/commands.
- Required evidence.

Avoid “build the whole economy” or “make it like Total War.”

## Context management

Put stable knowledge in canonical documents. Tell the agent to read them; do not paste the entire architecture into every chat.

Tag exact files only when they are known. Let search find related code. Remove irrelevant files from the prompt.

## Completion standard

An agent response is not completion. Completion requires:

- Implemented acceptance criteria.
- Relevant tests.
- `pnpm check` or documented reason a narrower command is the correct gate.
- No suppressed errors.
- No untracked schema/save effects.
- Profiling evidence when scale changed.
- Changed-file and risk summary.

Use `prompts/templates/completion-review.md`.

## Dangerous behavior

Reject or stop work that:

- Rewrites broad unrelated areas.
- Adds dependencies without justification.
- Uses `any`, disabled lint, skipped tests, or broad `@ts-ignore`.
- Copies game rules into UI.
- uses `Math.random` in simulation.
- deletes migrations/fixtures to make tests pass.
- claims performance without running a benchmark.
- introduces proprietary D&D content.
- imports unlicensed art.
