# Pixel Asset and Sorceress Pipeline

## Goal

Convert source art into consistent, licensed, data-addressable runtime assets without letting binary files dominate the codebase or Cursor context.

Sorceress tools can assist with pixel conversion, sprite-sheet slicing, analysis, and metadata export. Treat their output as an intermediate source, not automatically production-ready runtime data.

## Directory convention

```text
art/
  source/                         original/working assets; excluded from Cursor
  imports/<asset-id>/             normalized Sorceress export and notes
  palettes/
  asset-manifest.json
apps/client/public/assets/generated/
  atlases/
  maps/
  ui/
```

Large source binaries may use Git LFS or external object storage later. Generated atlases should be reproducible.

## Asset manifest

Every asset record should contain:

- Stable ID.
- Category.
- Source files.
- Runtime files.
- Pixel dimensions and frame dimensions.
- Frame names and animation tags.
- Pivot/origin.
- Atlas group.
- Palette/tint policy.
- License/provenance record ID.
- Hash.
- Importer version.
- Notes.

Validate `art/asset-manifest.json` before build.

## Sorceress import workflow

1. Confirm rights to the input image or generated source.
2. Save the unmodified source and provenance record.
3. Use Sorceress to convert/analyze/slice.
4. Export PNG and any available JSON/config metadata.
5. Place the export under `art/imports/<asset-id>/`.
6. Create or update the project asset manifest.
7. Normalize frame names:
   `unit.<culture>.<class>.<action>.<direction>.<frame>`.
8. Verify frame dimensions, transparent alpha, pivot, and edge padding.
9. Assign atlas group.
10. Run `pnpm assets:validate`.
11. Generate runtime atlas output.
12. Inspect nearest-neighbor rendering at 1×, 2×, and fractional camera zoom.
13. Update the third-party asset register.
14. Commit source metadata and manifests; follow the chosen binary policy.

Do not assume Sorceress JSON field names. Write an adapter for the actual exported schema and keep the project manifest stable.

## GPU-layer constraints

For large rank-and-file layers:

- One compatible texture per `SpriteGPULayer`.
- Prefer power-of-two texture dimensions where practical.
- Add/extrude padding around frames to reduce seams.
- Group unit frames needed by one visual population into the same texture.
- Preallocate capacity where repeated add/remove would rebuild buffers.
- Use alpha/scale masks for inactive slots.
- Update transforms at tactical phase boundaries rather than every render frame when possible.

## Pixel rendering

- Use nearest-neighbor sampling.
- Establish a base pixel density, such as 1 game pixel = 2–4 display pixels at default zoom.
- Keep camera position/zoom strategy consistent to avoid shimmer.
- Use palette swaps or tinting for factions only when silhouette/readability remains strong.
- Keep text in HTML/Canvas UI, not baked into sprites.
- Provide non-color identification for teams.

## Animation budget

A formation does not need every soldier to run a unique full animation graph.

Use:

- Limited directional/action sets.
- Stable phase offsets from a presentation seed.
- Capped animation rates at distant zoom.
- Lower frame variants for distant LOD.
- Special animations for selected and hero units.
- Pooled effects.

## Licensing

For every source, record:

- Original creator/source.
- License or contract.
- Commercial-use permission.
- Attribution requirements.
- Restrictions on redistribution or derivatives.
- Whether AI conversion or editing is permitted.
- Date acquired.
- Local proof/reference.

A conversion tool does not cleanse copyright. Do not use copyrighted game, film, tabletop, or stock assets as source material without rights.

## Quality checklist

- True transparency; no embedded checkerboard.
- No accidental matte/fringe.
- Consistent frame box and pivot.
- No clipping across frames.
- Stable silhouette.
- Correct direction naming.
- Palette within project constraints.
- Runtime atlas frame names validated.
- Rights record complete.
- Hash updated only when binary changed intentionally.
