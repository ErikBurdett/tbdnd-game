---
name: create-adr
description: Record an expensive-to-reverse architecture, compatibility, performance, or product decision with context, alternatives, consequences, and verification.
disable-model-invocation: true
---

# Create ADR

Use `docs/adr/README.md`.

Create the next numbered ADR only when the decision:

- Crosses package boundaries.
- Changes authoritative ordering or numeric policy.
- Changes save/content compatibility.
- Adds a backend/networking/WASM/custom renderer.
- Changes the scale model.
- Adds a major dependency or deployment constraint.
- Is expensive to reverse.

Do not write an ADR for ordinary implementation details.

The decision must be concrete and include verification. Link any superseded ADR rather than rewriting it.
