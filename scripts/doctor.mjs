import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

const checks = [];
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
checks.push({
  label: `Node ${process.versions.node}`,
  ok: nodeMajor >= 22,
  detail: "requires Node 22+",
});
checks.push({ label: "Git available", ok: commandWorks("git", ["--version"]) });
checks.push({
  label: "pnpm available",
  ok: commandWorks("pnpm", ["--version"]),
  detail: "enable Corepack or install pnpm 11.22.0",
});
checks.push({ label: "Cursor project rules", ok: existsSync(".cursor/rules/00-project-core.mdc") });
checks.push({ label: "Cursor skills", ok: existsSync(".cursor/skills/plan-feature/SKILL.md") });
checks.push({ label: "Client scaffold", ok: existsSync("apps/client/src/main.tsx") });

for (const check of checks) {
  console.log(
    `${check.ok ? "PASS" : "FAIL"}  ${check.label}${check.detail && !check.ok ? ` — ${check.detail}` : ""}`,
  );
}

if (checks.some((check) => !check.ok)) {
  process.exitCode = 1;
}

function commandWorks(command, args) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
