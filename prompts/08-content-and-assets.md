# Content and Sorceress Asset Import Prompt

For data, invoke `/add-game-content`.
For a Sorceress export, invoke `/import-sorceress-assets`.

Before editing, identify:

- Stable content/asset IDs.
- Historical classification and sources.
- Fantasy divergence.
- Actual source/export files and metadata.
- Rights basis and release status.
- Atlas/rendering requirements.
- Frames, pivots, directions, and animations.

Do not guess Sorceress export fields. Inspect the actual JSON and write an adapter into the stable project manifest.

Do not call an asset release-ready if source rights are unknown. Mark it prototype-only and keep the rights gate visible.

Run content and asset validation and report unresolved provenance or visual issues.
