# Save and Replay Prompt

Invoke `/plan-feature` and `/save-migration` if the format changes.

Build the smallest complete local save/replay capability:

- Versioned save envelope.
- Authoritative snapshot and RNG streams.
- State hash.
- Command tail.
- IndexedDB repository adapter outside simulation.
- Atomic write/staging.
- Validation and readable corruption/missing-content failures.
- Load continuation equivalence.
- Replay from seed/snapshot and accepted commands.
- First-divergence diagnostic checkpoints.

Do not save presentation animation state. Use strategic/battle/party phase boundaries.

Include prior-version fixture and migration only when a prior format exists. Keep the original save untouched on failure.
