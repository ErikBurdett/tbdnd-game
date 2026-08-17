# Stable Project Asset Manifest

The project manifest is intentionally independent of Sorceress export versions.

```json
{
  "version": 1,
  "assets": [
    {
      "id": "unit.frontier-infantry",
      "category": "unit-sprite-sheet",
      "sourceFiles": ["art/imports/unit.frontier-infantry/sheet.png"],
      "runtimeFiles": ["assets/generated/atlases/frontier-infantry.png"],
      "width": 256,
      "height": 256,
      "frameWidth": 32,
      "frameHeight": 32,
      "pivot": { "x": 0.5, "y": 0.78 },
      "atlasGroup": "battle-infantry-a",
      "renderer": "sprite-gpu-layer",
      "animations": [
        {
          "id": "idle.south",
          "frames": ["idle.south.0", "idle.south.1"],
          "fps": 6,
          "loop": true
        }
      ],
      "provenanceId": "asset-source.frontier-infantry",
      "sha256": "<64 hex chars>",
      "notes": ""
    }
  ]
}
```

## Rules

- IDs are unique and stable.
- Paths are repository-relative and may not escape the repository.
- Runtime paths point only to generated output.
- Pivot values are normalized 0–1.
- Dimensions are positive integers.
- Frame dimensions divide or are mapped explicitly into the sheet.
- `renderer: sprite-gpu-layer` requires a compatible single texture.
- `sha256` hashes the source binary selected by the importer.
- The source rights record is mandatory before release.
