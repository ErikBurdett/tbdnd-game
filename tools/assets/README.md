# Asset tools

## Validate the checked-in example

```bash
pnpm assets:validate
```

The validator checks stable IDs, frame metadata, repository-safe paths, PNG dimensions, SHA-256 values, animation references, and the license-register link.

## Normalize a real Sorceress metadata export

```bash
node tools/assets/normalize-sorceress-export.mjs \
  art/imports/my-unit/sorceress-export.json \
  art/imports/my-unit/normalized-review.json \
  unit.culture.class
```

The adapter supports only a conservative frames array/object shape. It deliberately emits `reviewRequired: true`; inspect a real export and extend the adapter rather than assuming undocumented field meanings.
