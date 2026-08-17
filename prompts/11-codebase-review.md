# Codebase Review Prompt

Use the `architect`, `simulation-engineer`, and `verifier` subagents only where their focused responsibilities apply; do not launch them for trivial files.

Review the current branch against:

- `PROJECT_CONFIG.md`
- `docs/ARCHITECTURE.md`
- `docs/SIMULATION_CONTRACT.md`
- `docs/SCALE_MODEL.md`
- `docs/PERFORMANCE_BUDGETS.md`
- Active milestone acceptance criteria

Findings should prioritize:

1. Incorrect authoritative behavior.
2. Determinism/save/replay hazards.
3. Dependency-boundary violations.
4. Scale/performance hazards.
5. Data validation/reference issues.
6. UI/accessibility regressions.
7. Missing tests or inaccurate docs.

Cite exact files and explain a concrete failure scenario. Do not create a style-only review that ignores game correctness.
