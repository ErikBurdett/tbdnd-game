# Repository Initialization Prompt

Read the project rules and Milestone 0 documentation. Bring the scaffold to a clean reproducible baseline.

Acceptance criteria:

- `pnpm install` succeeds from a clean checkout and creates a committed lockfile.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm content:validate`, `pnpm assets:validate`, and `pnpm build` all pass.
- `pnpm dev` launches the client without console errors.
- Campaign worker initializes and returns a stable sample state hash.
- Strategic map and battle benchmark scenes can be entered repeatedly without duplicated listeners.
- The benchmark displays its configured visual instance count and frame telemetry.
- CI matches local commands.
- README setup is accurate.
- No architecture boundary violation or skipped check is introduced.

Do not add gameplay systems beyond what is needed to prove the scaffold.

Start in Plan mode. Inspect actual package APIs and versions before editing. Implement in small increments and show command evidence.
