# Completion Review Prompt

Use the `verifier` subagent.

Compare the actual diff and runtime/check output with the original acceptance criteria.

Report:

- Pass/fail for every criterion.
- Commands run and exit status.
- Determinism/save/content/migration assessment.
- Architecture boundary assessment.
- Performance evidence.
- Accessibility impact.
- Findings by severity with exact paths.
- Residual risk.
- Verdict: ready, ready with stated risk, or not ready.

Do not edit code during this review.
