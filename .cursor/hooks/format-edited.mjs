import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";

let raw = "";
for await (const chunk of process.stdin) {
  raw += chunk;
}

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath = typeof input.file_path === "string" ? resolve(input.file_path) : undefined;
if (!filePath || !existsSync(filePath)) {
  process.exit(0);
}

const projectRoot = process.cwd();
const relativePath = relative(projectRoot, filePath);

if (
  relativePath.startsWith("..") ||
  relativePath.includes("node_modules") ||
  relativePath.includes("/dist/") ||
  relativePath.includes("\\dist\\")
) {
  process.exit(0);
}

const supported = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"]);
const extension = filePath.slice(filePath.lastIndexOf("."));
if (!supported.has(extension)) {
  process.exit(0);
}

const biomePath =
  process.platform === "win32"
    ? resolve(projectRoot, "node_modules/.bin/biome.cmd")
    : resolve(projectRoot, "node_modules/.bin/biome");

if (!existsSync(biomePath)) {
  // A fresh clone may not have dependencies yet. Formatting remains available after pnpm install.
  process.exit(0);
}

const result = spawnSync(biomePath, ["check", "--write", filePath], {
  cwd: projectRoot,
  encoding: "utf8",
  stdio: "pipe",
  timeout: 12_000,
});

if (result.status !== 0 && result.stderr) {
  process.stderr.write(result.stderr);
}

// Formatting should not block an agent edit. CI remains the authoritative gate.
process.exit(0);
