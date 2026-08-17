---
name: add-game-content
description: Add or edit factions, provinces, units, buildings, research, events, missions, cultures, or magic traditions with schemas, references, provenance, and validation.
paths:
  - "content/**/*.json"
  - "packages/game-data/**/*.ts"
disable-model-invocation: false
---

# Add Game Content

Read `docs/HISTORICAL_FANTASY_POLICY.md` and the relevant schema.

## Workflow

1. Determine whether this is:
   - attested
   - reconstructed
   - composite
   - invented-historical
   - fantasy-divergence
   - anachronistic-gameplay
2. Reuse existing tags/IDs before adding new ones.
3. Assign a stable namespaced kebab-case ID.
4. Store display/localization keys separately.
5. Use documented numeric units and ranges.
6. Add source IDs/confidence for central historical claims.
7. State gameplay abstraction and fantasy divergence.
8. Resolve all cross-references.
9. Add/update a focused schema or balance test.
10. Run `pnpm content:validate`.

## Content quality

- Avoid monolithic cultural stereotypes.
- Separate polity/culture/language/religion/status.
- Do not copy D&D names, lore, stats, spell text, or art.
- Do not invent historical precision.
- Keep mechanics inspectable; explain modifier sources.
