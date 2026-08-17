# AI Architecture

## Principle

AI uses the same legal command interfaces as the player. It may read an AI-specific knowledge model, but it cannot mutate state directly or inspect hidden player information.

## Layers

### Strategic goals

Long-lived goals:

- Defend threatened core.
- Secure supply route.
- Capture war objective.
- Stabilize unrest.
- Grow economy.
- Complete research direction.
- Explore site.
- Preserve ruler or army.
- Fulfill treaty or client obligation.

Represent goals with priority, deadline, target, prerequisites, progress, and cancellation conditions.

### Planning

Use a modest goal/plan or HTN-style system that expands goals into operations:

```text
capture province
→ assemble suitable force
→ secure route and supply
→ move to staging province
→ scout
→ attack or besiege
→ hold and recover
```

Do not build a general-purpose theorem prover.

### Utility selection

At each decision point, score legal candidate actions using normalized considerations:

- Goal progress.
- Risk.
- Cost.
- Time.
- Information confidence.
- Personality/doctrine.
- Opportunity.
- Strategic exposure.

Store score breakdowns for debugging.

### Tactical doctrine

Formation battle AI should reason at formation and command-group level:

- Hold center.
- Refuse flank.
- Screen.
- Probe.
- Concentrate ranged fire.
- Commit reserve.
- Withdraw.
- Rally.

It should not run a behavior tree for every soldier.

### Party AI

Party encounters can use individual utility actions because the agent count is small. Maintain deterministic tie-breaking.

## Knowledge model

AI receives:

- Confirmed observations.
- Last-known state with age.
- Inferences permitted by rules.
- Public diplomatic information.
- Its own assets and plans.

It does not receive the raw full campaign state.

## Budgets

Every AI phase has:

- Maximum candidate count.
- Maximum planning depth.
- Maximum operation expansions.
- Time/step instrumentation.
- Deterministic fallback action.

Prefer deterministic operation counts over wall-clock cutoffs for authoritative decisions. Wall-clock metrics may warn, but should not change chosen action.

## Testing

- Legal-action tests.
- No-hidden-information tests.
- Fixed-seed decision snapshots.
- Goal completion scenario fixtures.
- Pathological map and no-resource cases.
- Long-run “does not deadlock” soak.
- Score explanation assertions.

## AI observability

Development UI should show:

- Active goals.
- Considered operations.
- Top action scores and breakdown.
- Rejected candidates and reasons.
- Known versus inferred information.
- Budget consumption.
