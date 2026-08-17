---
name: import-sorceress-assets
description: Normalize a Sorceress pixel-art or sprite-sheet export into the project asset manifest, verify frames and transparency, and record licensing/provenance.
paths:
  - "art/**"
  - "tools/assets/**"
  - "apps/client/public/assets/**"
disable-model-invocation: false
---

# Import Sorceress Assets

Read `docs/ASSET_PIPELINE.md` and `references/ASSET_FORMAT.md`.

## Inputs required

- Source/export directory.
- Asset category and stable ID.
- PNG sprite sheet or frames.
- Sorceress JSON/config if available.
- Frame dimensions, direction/action naming, and pivot intent.
- Rights/provenance information.

Do not proceed as production-ready if the rights basis is unknown. It may be imported into a local prototype area with an explicit `unknown/not-for-release` marker.

## Procedure

1. Preserve the original export under `art/imports/<asset-id>/`.
2. Hash source files.
3. Inspect alpha, dimensions, frame boundaries, padding, and checkerboard/matte errors.
4. Read actual Sorceress metadata; do not guess its schema.
5. Convert it through an adapter into the stable project manifest.
6. Normalize frame IDs:
   `unit.<culture>.<class>.<action>.<direction>.<frame>`.
7. Assign pivot, atlas group, palette/tint policy, and intended renderer.
8. For `SpriteGPULayer`, verify one-texture compatibility, padding, and atlas dimensions.
9. Update `LICENSES/THIRD_PARTY_ASSET_REGISTER.csv`.
10. Run:
    `node tools/assets/validate-manifest.mjs art/asset-manifest.json`
11. Generate runtime output through the asset tool; do not hand-edit generated files.
12. Visually inspect nearest-neighbor rendering at multiple zooms.

## Completion report

Include source/export paths, manifest entry, rights status, generated outputs, validation result, and any frame/pivot uncertainty.
