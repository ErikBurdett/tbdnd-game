import { rm } from "node:fs/promises";

const targets = [
  "apps/client/dist",
  "packages/sim-core/dist",
  "packages/battle-sim/dist",
  "packages/game-data/dist",
  "coverage",
];

for (const target of targets) {
  await rm(target, { recursive: true, force: true });
}

console.log("Removed generated build and coverage directories.");
