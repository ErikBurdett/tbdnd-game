---
name: release-check
description: Run the repository's full completion and release-readiness checks, inspect the diff, and produce an evidence-based ready/not-ready report.
disable-model-invocation: true
---

# Release Check

Use the `verifier` subagent when available.

## Checklist

1. Read milestone acceptance criteria.
2. Inspect `git status` and diff.
3. Check generated/binary changes and asset rights.
4. Run `node .cursor/skills/release-check/scripts/run-checks.mjs`.
5. Run relevant browser smoke and benchmark steps that are not automated.
6. Confirm:
   - No TODO/placeholders for required behavior.
   - No skipped/disabled tests or type suppression.
   - Determinism and replay checks.
   - Save/content migrations.
   - Architecture boundaries.
   - Documentation/ADR updates.
   - Accessibility baseline for changed UI.
   - Performance evidence for scale changes.
7. Report pass/fail by acceptance criterion.

Do not edit failures away during verification. Return them to implementation as explicit work.
