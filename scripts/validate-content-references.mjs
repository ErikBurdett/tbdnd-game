import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentRoot = path.join(root, "content/core");
const issues = [];
const allowedClassifications = new Set([
  "attested",
  "reconstructed",
  "composite",
  "invented-historical",
  "fantasy-divergence",
  "anachronistic-gameplay",
]);

const [sources, factions, provinces, units, buildings, research] = await Promise.all([
  loadArray("sources.json"),
  loadArray("factions.json"),
  loadArray("provinces.json"),
  loadArray("units.json"),
  loadArray("buildings.json"),
  loadArray("research.json"),
]);

const sourceIds = indexUnique("source", sources);
const factionIds = indexUnique("faction", factions);
const provinceIds = indexUnique("province", provinces);
indexUnique("unit", units);
indexUnique("building", buildings);
const researchIds = indexUnique("research", research);

for (const [collectionName, records] of [
  ["faction", factions],
  ["province", provinces],
  ["unit", units],
  ["building", buildings],
  ["research", research],
]) {
  for (const record of records) {
    if (!allowedClassifications.has(record.classification)) {
      issues.push(
        `${collectionName} ${record.id ?? "<missing-id>"} has invalid classification ${String(record.classification)}`,
      );
    }
    for (const citation of record.citations ?? []) {
      if (!sourceIds.has(citation.sourceId)) {
        issues.push(`${collectionName} ${record.id} cites missing source ${citation.sourceId}`);
      }
    }
  }
}

const provinceById = new Map(provinces.map((record) => [record.id, record]));
for (const faction of factions) {
  if (!provinceIds.has(faction.capitalProvinceId)) {
    issues.push(`faction ${faction.id} references missing capital ${faction.capitalProvinceId}`);
    continue;
  }
  const capital = provinceById.get(faction.capitalProvinceId);
  if (capital?.ownerFactionId !== faction.id) {
    issues.push(
      `faction ${faction.id} capital ${faction.capitalProvinceId} is owned by ${capital?.ownerFactionId ?? "nobody"}`,
    );
  }
}

for (const province of provinces) {
  if (!factionIds.has(province.ownerFactionId)) {
    issues.push(`province ${province.id} references missing owner ${province.ownerFactionId}`);
  }
  if (
    typeof province.strategicPosition?.x !== "number" ||
    typeof province.strategicPosition?.y !== "number" ||
    province.strategicPosition.x < 0 ||
    province.strategicPosition.x > 1 ||
    province.strategicPosition.y < 0 ||
    province.strategicPosition.y > 1
  ) {
    issues.push(`province ${province.id} has an invalid normalized strategic position`);
  }
  for (const neighborId of province.neighborIds ?? []) {
    if (!provinceIds.has(neighborId)) {
      issues.push(`province ${province.id} references missing neighbor ${neighborId}`);
      continue;
    }
    const reverse = provinceById.get(neighborId)?.neighborIds ?? [];
    if (!reverse.includes(province.id)) {
      issues.push(`province adjacency is asymmetric: ${province.id} -> ${neighborId}`);
    }
  }
}

for (const unit of units) {
  for (const factionId of unit.factionIds ?? []) {
    if (!factionIds.has(factionId)) {
      issues.push(`unit ${unit.id} references missing faction ${factionId}`);
    }
  }
  checkResearchReferences(`unit ${unit.id}`, unit.requiredResearchIds ?? []);
}

for (const building of buildings) {
  checkResearchReferences(`building ${building.id}`, building.requiredResearchIds ?? []);
}

for (const node of research) {
  checkResearchReferences(`research ${node.id}`, node.prerequisiteIds ?? []);
}
checkResearchCycles(research);

if (issues.length > 0) {
  console.error(`Content reference validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  `Content references passed (${sources.length} sources, ${factions.length} factions, ${provinces.length} provinces, ${units.length} units, ${buildings.length} buildings, ${research.length} research nodes).`,
);

async function loadArray(fileName) {
  const filePath = path.join(contentRoot, fileName);
  let value;
  try {
    value = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    issues.push(
      `${fileName} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }
  if (!Array.isArray(value)) {
    issues.push(`${fileName} must contain an array`);
    return [];
  }
  return value;
}

function indexUnique(kind, records) {
  const ids = new Set();
  for (const record of records) {
    if (typeof record.id !== "string" || record.id.length === 0) {
      issues.push(`${kind} record is missing a non-empty id`);
      continue;
    }
    if (ids.has(record.id)) {
      issues.push(`duplicate ${kind} id ${record.id}`);
    }
    ids.add(record.id);
  }
  return ids;
}

function checkResearchReferences(owner, ids) {
  for (const id of ids) {
    if (!researchIds.has(id)) {
      issues.push(`${owner} references missing research ${id}`);
    }
  }
}

function checkResearchCycles(records) {
  const graph = new Map(records.map((record) => [record.id, record.prerequisiteIds ?? []]));
  const visiting = new Set();
  const visited = new Set();

  for (const id of graph.keys()) {
    visit(id, []);
  }

  function visit(id, pathStack) {
    if (visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      const cycleStart = pathStack.indexOf(id);
      const cycle = [...pathStack.slice(Math.max(cycleStart, 0)), id].join(" -> ");
      issues.push(`research prerequisite cycle detected: ${cycle}`);
      return;
    }
    visiting.add(id);
    for (const prerequisite of graph.get(id) ?? []) {
      if (graph.has(prerequisite)) {
        visit(prerequisite, [...pathStack, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }
}
