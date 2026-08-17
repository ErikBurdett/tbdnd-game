# ADR-0005: Content, provenance, and fantasy divergence are data

- Status: accepted
- Date: 2026-08-16

## Context

The game combines a historical starting world with fantasy. It also imports map and pixel assets from external tools and sources. Untracked claims and rights create accuracy and legal risk.

## Decision

Definitions are data validated by schemas. Historically relevant records can carry provenance classification, confidence, and source IDs. Assets require a rights/provenance register and manifest. Fantasy divergences are explicit.

## Consequences

- More metadata and validation work.
- Easier content review, modding, and correction.
- Gameplay code does not hard-code historical assertions.
- Converted assets do not bypass rights review.

## Verification

- Content reference validation.
- Provenance fields for release content.
- Asset register completeness gate.
