import { spawnSync } from "node:child_process";

const commands = [
  ["pnpm", ["lint"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["test"]],
  ["pnpm", ["content:validate"]],
  ["pnpm", ["assets:validate"]],
  ["pnpm", ["build"]],
];

const results = [];
let failed = false;

for (const [command, args] of commands) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const durationMs = Date.now() - started;
  const ok = result.status === 0;
  failed ||= !ok;
  results.push({
    command: `${command} ${args.join(" ")}`,
    ok,
    status: result.status,
    durationMs,
    stdout: result.stdout?.slice(-4000) ?? "",
    stderr: result.stderr?.slice(-4000) ?? "",
  });
  console.log(`${ok ? "PASS" : "FAIL"} ${command} ${args.join(" ")} (${durationMs}ms)`);
  if (!ok) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

console.log(JSON.stringify({ ok: !failed, results }, null, 2));
process.exit(failed ? 1 : 0);
