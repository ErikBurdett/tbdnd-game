# Security and Supply-Chain Notes

The first version is offline-first, but browser games still process untrusted data.

## Trust boundaries

Validate:

- Content packs.
- Save files.
- Imported sprite metadata.
- Future mods.
- Worker messages at version boundaries.
- Future server responses.
- User-provided names/text before rendering or export.

React escapes ordinary text, but do not inject content through raw HTML.

## Secrets

The client bundle cannot safely contain secrets. Never place API keys, signing keys, payment secrets, private telemetry tokens, or privileged cloud credentials in `VITE_*` variables.

## Dependencies

- Pin direct dependencies.
- Commit the lockfile after first install.
- Review install scripts and dependency changes.
- Keep CI read-only except where explicitly needed.
- Use automated dependency alerts, but review upgrades against deterministic fixtures and benchmarks.

## Cursor

- Keep work in version control.
- Review shell commands.
- Treat `.cursorignore` as context control, not a complete security boundary.
- Do not give agents production credentials.
- Keep destructive commands behind approval.
- Add a shell guard hook before production deployment tooling exists.

## Saves and mods

- Cap decompressed size.
- Reject path traversal in archives.
- Never execute arbitrary JavaScript from a content pack in the initial mod system.
- Use declarative schemas and a constrained rule DSL later.
- Preserve the original save when migration or mod resolution fails.
