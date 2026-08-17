import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const issues = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function report(file, message) {
  issues.push(`${path.relative(root, file)}: ${message}`);
}

const simulationRoots = [
  path.join(root, "packages/sim-core/src"),
  path.join(root, "packages/battle-sim/src"),
];

for (const simulationRoot of simulationRoots) {
  for (const file of await walk(simulationRoot)) {
    if (file.includes(`${path.sep}__tests__${path.sep}`)) {
      continue;
    }
    const source = await readFile(file, "utf8");
    const forbiddenImports = ["phaser", "react", "dexie", "apps/client", "node:"];
    for (const forbidden of forbiddenImports) {
      const importPattern = new RegExp(`(?:from\\s+["']|import\\s*\\(["'])[^"']*${forbidden}`);
      if (importPattern.test(source)) {
        report(file, `authoritative simulation imports forbidden dependency fragment ${forbidden}`);
      }
    }
    for (const [pattern, label] of [
      [/Math\.random\s*\(/, "Math.random"],
      [/Date\.now\s*\(/, "Date.now"],
      [/performance\.now\s*\(/, "performance.now"],
      [/new\s+Date\s*\(/, "wall-clock Date construction"],
      [/setTimeout\s*\(/, "setTimeout"],
      [/setInterval\s*\(/, "setInterval"],
    ]) {
      if (pattern.test(source)) {
        report(file, `authoritative code uses forbidden ${label}`);
      }
    }
  }
}

const sceneRoot = path.join(root, "apps/client/src/game");
for (const file of await walk(sceneRoot)) {
  const source = await readFile(file, "utf8");
  if (/from\s+["']react["']/.test(source)) {
    report(file, "Phaser renderer code must not import React");
  }
}

if (issues.length > 0) {
  console.error(`Architecture check failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Architecture dependency and deterministic-API checks passed.");
