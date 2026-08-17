import type { ContentBundle } from "./bundle";

export interface ContentIssue {
  path: string;
  message: string;
}

function indexById<T extends { id: string }>(
  records: T[],
  path: string,
  issues: ContentIssue[],
): Map<string, T> {
  const index = new Map<string, T>();
  records.forEach((record, recordIndex) => {
    if (index.has(record.id)) {
      issues.push({
        path: `${path}[${recordIndex}].id`,
        message: `Duplicate ID ${record.id}.`,
      });
    }
    index.set(record.id, record);
  });
  return index;
}

function validateCitations(
  records: Array<{ id: string; citations: Array<{ sourceId: string }> }>,
  recordPath: string,
  sourceIds: Set<string>,
  issues: ContentIssue[],
): void {
  records.forEach((record, recordIndex) => {
    record.citations.forEach((citation, citationIndex) => {
      if (!sourceIds.has(citation.sourceId)) {
        issues.push({
          path: `${recordPath}[${recordIndex}].citations[${citationIndex}].sourceId`,
          message: `${record.id} cites missing source ${citation.sourceId}.`,
        });
      }
    });
  });
}

function detectResearchCycles(
  prerequisitesById: Map<string, string[]>,
  issues: ContentIssue[],
): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string, trail: string[]): void => {
    if (visiting.has(id)) {
      const cycleStart = trail.indexOf(id);
      const cycle = [...trail.slice(Math.max(0, cycleStart)), id].join(" -> ");
      issues.push({ path: `research.${id}.prerequisiteIds`, message: `Research cycle: ${cycle}.` });
      return;
    }
    if (visited.has(id)) {
      return;
    }
    visiting.add(id);
    for (const prerequisiteId of prerequisitesById.get(id) ?? []) {
      if (prerequisitesById.has(prerequisiteId)) {
        visit(prerequisiteId, [...trail, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of [...prerequisitesById.keys()].sort()) {
    visit(id, []);
  }
}

export function validateContentReferences(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const sourceIndex = indexById(bundle.sources, "sources", issues);
  const factionIndex = indexById(bundle.factions, "factions", issues);
  const provinceIndex = indexById(bundle.provinces, "provinces", issues);
  indexById(bundle.units, "units", issues);
  indexById(bundle.buildings, "buildings", issues);
  const researchIndex = indexById(bundle.research, "research", issues);

  const sourceIds = new Set(sourceIndex.keys());
  validateCitations(bundle.factions, "factions", sourceIds, issues);
  validateCitations(bundle.provinces, "provinces", sourceIds, issues);
  validateCitations(bundle.units, "units", sourceIds, issues);
  validateCitations(bundle.buildings, "buildings", sourceIds, issues);
  validateCitations(bundle.research, "research", sourceIds, issues);

  bundle.factions.forEach((faction, factionIndexPosition) => {
    if (!provinceIndex.has(faction.capitalProvinceId)) {
      issues.push({
        path: `factions[${factionIndexPosition}].capitalProvinceId`,
        message: `${faction.id} names missing capital province ${faction.capitalProvinceId}.`,
      });
    }
  });

  bundle.provinces.forEach((province, provinceIndexPosition) => {
    if (!factionIndex.has(province.ownerFactionId)) {
      issues.push({
        path: `provinces[${provinceIndexPosition}].ownerFactionId`,
        message: `${province.id} has missing owner ${province.ownerFactionId}.`,
      });
    }
    province.neighborIds.forEach((neighborId, neighborPosition) => {
      const neighbor = provinceIndex.get(neighborId);
      if (!neighbor) {
        issues.push({
          path: `provinces[${provinceIndexPosition}].neighborIds[${neighborPosition}]`,
          message: `${province.id} names missing neighbor ${neighborId}.`,
        });
      } else if (!neighbor.neighborIds.includes(province.id)) {
        issues.push({
          path: `provinces[${provinceIndexPosition}].neighborIds[${neighborPosition}]`,
          message: `Adjacency must be symmetric: ${neighborId} does not name ${province.id}.`,
        });
      }
    });
  });

  const validateResearchIds = (ids: string[], path: string): void => {
    ids.forEach((researchId, researchPosition) => {
      if (!researchIndex.has(researchId)) {
        issues.push({
          path: `${path}[${researchPosition}]`,
          message: `Missing research node ${researchId}.`,
        });
      }
    });
  };

  bundle.units.forEach((unit, unitIndex) => {
    unit.factionIds.forEach((factionId, factionPosition) => {
      if (!factionIndex.has(factionId)) {
        issues.push({
          path: `units[${unitIndex}].factionIds[${factionPosition}]`,
          message: `${unit.id} names missing faction ${factionId}.`,
        });
      }
    });
    validateResearchIds(unit.requiredResearchIds, `units[${unitIndex}].requiredResearchIds`);
  });

  bundle.buildings.forEach((building, buildingIndex) => {
    validateResearchIds(
      building.requiredResearchIds,
      `buildings[${buildingIndex}].requiredResearchIds`,
    );
  });

  const prerequisitesById = new Map<string, string[]>();
  bundle.research.forEach((research, researchIndexPosition) => {
    validateResearchIds(
      research.prerequisiteIds,
      `research[${researchIndexPosition}].prerequisiteIds`,
    );
    if (research.prerequisiteIds.includes(research.id)) {
      issues.push({
        path: `research[${researchIndexPosition}].prerequisiteIds`,
        message: `${research.id} cannot require itself.`,
      });
    }
    prerequisitesById.set(research.id, research.prerequisiteIds);
  });
  detectResearchCycles(prerequisitesById, issues);

  return issues;
}

export function assertValidContentReferences(bundle: ContentBundle): void {
  const issues = validateContentReferences(bundle);
  if (issues.length > 0) {
    const details = issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n");
    throw new Error(`Content reference validation failed:\n${details}`);
  }
}
