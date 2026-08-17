---
name: build-vertical-slice
description: Execute the next bounded portion of the first playable campaign-to-battle loop defined in docs/VERTICAL_SLICE.md. Use when advancing the core milestone rather than adding unrelated systems.
disable-model-invocation: true
---

# Build Vertical Slice

Read `docs/VERTICAL_SLICE.md`, `docs/ROADMAP.md`, and `BACKLOG.md`.

## Procedure

1. Determine the first incomplete acceptance criterion in the active milestone.
2. Verify all preceding contracts/tests exist.
3. Select one end-to-end increment that can be completed in this chat.
4. Write or update a failing test/fixture first where practical.
5. Implement through all required layers without bypassing boundaries:
   - Definition/schema.
   - Command.
   - Validation/resolution.
   - Event.
   - Read model.
   - Worker message.
   - Minimal UI/render surface.
6. Do not build optional polish or neighboring systems.
7. Run narrow checks while iterating.
8. Run `pnpm check` when the increment is complete.
9. Update the roadmap checkbox/status notes and any changed contract documentation.
10. Report what the player can now do that they could not do before.

## Stop conditions

Stop and plan rather than improvise when:

- A save/content schema needs migration.
- A cross-package dependency would reverse direction.
- Determinism cannot be stated.
- Performance counts are undefined.
- The increment requires broad work outside the active milestone.
