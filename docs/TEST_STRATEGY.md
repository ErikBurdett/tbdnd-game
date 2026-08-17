# Test Strategy

## Testing pyramid for this game

The most valuable tests run headless against simulation packages. Rendering tests are important but should not carry the burden of proving game-rule correctness.

### Level 1 — pure rule tests

Examples:

- Movement cost.
- Recruitment eligibility.
- Damage and armor components.
- Morale transition.
- Research prerequisites.
- Supply consumption.
- Visibility filtering.

These should be small and fast.

### Level 2 — invariant/property tests

Examples:

- Population and strength never become negative.
- An entity cannot belong to two owners.
- Total casualties do not exceed starting strength.
- A routed formation cannot accept normal advance orders.
- Research cannot complete without prerequisites.
- State revision increases only for accepted commands.
- Rejected commands do not consume RNG.
- Province graph references remain valid.

Generate commands from a fixed seed.

### Level 3 — deterministic scenario tests

Run a scenario fixture through multiple phases/turns and assert:

- Event sequence.
- Key state values.
- State hash.
- Replay equivalence.
- Save/load continuation equivalence.

Prefer a few readable scenario assertions plus a hash; a hash alone gives poor diagnosis.

### Level 4 — content validation

Validate:

- Schema.
- Unique IDs.
- References.
- Graph cycles/reachability.
- Atlas frames.
- Provenance requirements.
- Balance sanity ranges.
- No unsupported tags.

### Level 5 — worker contract tests

Test:

- Initialization.
- Request IDs.
- Command acceptance/rejection.
- Progress.
- Snapshot version.
- Worker crash/fault handling.
- No stale preview overwrites newer state.

### Level 6 — browser integration

Later use Playwright for:

- New game.
- Province selection.
- Queue action.
- End turn.
- Battle scene transition.
- Save/load.
- Keyboard navigation.
- WebGL failure messaging.

Do not assert individual canvas pixels for ordinary game logic.

### Level 7 — performance and soak

- 100/1,000-turn synthetic campaign.
- Repeated save/load.
- Battle phase fixture at target formation count.
- Renderer benchmark at density tiers.
- Heap growth across scene transitions.
- Worker transfer throughput.
- Asset load/network profile.

## Determinism CI

At minimum:

1. Run identical scenario twice in one process.
2. Run from serialized midpoint.
3. Compare hashes and events.
4. Keep golden replay fixtures for released rules versions.
5. Run Node and at least one browser engine for release candidates.

## Snapshot policy

Use snapshots only for stable structured output. Avoid huge opaque snapshots of entire world state.

When a snapshot changes, review the semantic diff. Do not blindly update.

## Test naming

```text
given_<state>_when_<command>_then_<outcome>
```

or readable natural language:

```ts
it("does not consume the RNG stream when a move command is rejected", ...)
```

## Bug regression rule

Every fixed deterministic gameplay bug receives:

- Minimal failing fixture.
- Regression test.
- Explanation of root cause.
- Save/replay compatibility assessment.
