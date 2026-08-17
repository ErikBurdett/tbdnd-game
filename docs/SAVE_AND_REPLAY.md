# Save, Migration, and Replay

## Save envelope

```ts
interface SaveEnvelope {
  format: "ancient-world-save";
  schemaVersion: number;
  engineVersion: string;
  contentVersion: string;
  campaignId: string;
  createdAtIso: string;
  savedAtIso: string;
  stateHash: string;
  snapshot: unknown;
  commandTail: unknown[];
  metadata: SaveMetadata;
}
```

Wall-clock fields and screenshot metadata are excluded from the authoritative hash.

## Repository boundary

Simulation produces and consumes serializable snapshots. A browser repository adapter handles IndexedDB.

```ts
interface SaveRepository {
  list(): Promise<SaveSummary[]>;
  read(id: string): Promise<SaveEnvelope>;
  write(id: string, save: SaveEnvelope): Promise<void>;
  remove(id: string): Promise<void>;
}
```

The simulation package never imports IndexedDB or Dexie.

## Atomic writes

Use a staging record:

1. Serialize and validate.
2. Write new blob/record.
3. Verify hash/size.
4. Update save index pointer.
5. Delete obsolete staging record.

Do not overwrite the only good autosave in place.

## Migration

Every schema change needs an ordered migration:

```text
v1 → v2 → v3
```

Rules:

- Validate before and after each migration.
- Keep immutable fixture saves from prior supported versions.
- Do not use current content lookups to guess missing historical values unless the migration explicitly records that policy.
- Preserve unknown optional extension data where appropriate.
- Fail with a readable compatibility message.
- Never silently discard armies, characters, or content.

## Content compatibility

A save records `contentVersion` and definition IDs.

Strategies:

- Exact content pack available: load normally.
- Compatible newer pack: run explicit content migration.
- Missing mod/pack: show missing IDs and do not corrupt the original save.
- Rules changed: engine version controls replay expectations.

## Replays

A replay is a diagnostic and optional player feature.

```text
header
initial snapshot or scenario + seed
accepted command envelopes
periodic state hashes
optional checkpoints
optional presentation markers
```

Presentation camera movement and particles are not authoritative commands.

## Desync diagnosis

When replay diverges:

1. Find first mismatched checkpoint.
2. Bisect commands/phases.
3. Compare RNG streams.
4. Compare ordered events.
5. Compare canonical state sections.
6. Report the smallest differing path.

Build a development inspector around this workflow before multiplayer.

## Compression

Begin with browser-native `CompressionStream` where supported or a small proven library behind an adapter. Measure before choosing a format.

Compression must not be part of simulation determinism.

## Save restrictions

Prefer clear save boundaries:

- Strategic planning/aftermath.
- Battle phase boundaries.
- Party turn boundaries.

Mid-animation saves are unnecessary; save authoritative phase state and reconstruct presentation.
