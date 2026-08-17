# External Technical and Data References

Retrieved or checked 2026-08-16. Re-verify current versions before major upgrades.

## Cursor

- Rules: https://cursor.com/docs/rules
- Agent Skills: https://cursor.com/docs/skills
- Subagents: https://cursor.com/docs/subagents
- Hooks: https://cursor.com/docs/hooks
- Agent best practices: https://cursor.com/blog/agent-best-practices
- Plan mode: https://cursor.com/docs/agent/planning

## Phaser

- Phaser documentation: https://docs.phaser.io/
- Phaser repository: https://github.com/phaserjs/phaser
- SpriteGPULayer API: https://docs.phaser.io/api-documentation/class/gameobjects-spritegpulayer
- Phaser v4 features skill/reference: https://github.com/phaserjs/phaser/blob/master/skills/v4-new-features/SKILL.md

Important implementation notes from the official Phaser material:

- `SpriteGPULayer` is WebGL-only and uses one texture.
- It can render very large numbers of quads in one draw call.
- Buffer edits are expensive; populate in batches and avoid per-frame churn.
- Reuse member configuration objects during population.
- Fill rate, quad size, and device still determine real performance.
- Normal sprites/Blitter/custom batching may be more appropriate for highly dynamic objects.

## Sorceress

- Suite: https://sorcgcs.com/
- Sprite Analyzer: https://sorcgcs.com/tools/sprite-analyzer
- Pixel Snap: https://sorcgcs.com/tools/pixel-snap
- Sprite sheet tools should be evaluated against actual exports before writing a permanent adapter.

## Geodata

- Natural Earth: https://www.naturalearthdata.com/
- Pleiades: https://pleiades.stoa.org/
- OpenHistoricalMap: https://www.openhistoricalmap.org/

License every imported dataset and record transformations. Gameplay province boundaries should generally be authored/derived rather than presented as exact historical borders.

## Core packages

- Phaser: https://www.npmjs.com/package/phaser
- React: https://www.npmjs.com/package/react
- Vite: https://www.npmjs.com/package/vite
- TypeScript: https://www.npmjs.com/package/typescript
- pnpm: https://www.npmjs.com/package/pnpm
- Turborepo: https://www.npmjs.com/package/turbo
- Vitest: https://www.npmjs.com/package/vitest
- Zod: https://www.npmjs.com/package/zod
- Biome: https://www.npmjs.com/package/@biomejs/biome

Update versions intentionally and run determinism, save fixture, and performance checks.
