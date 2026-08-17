import {
  type ArmyId,
  type ArmyMovePreview,
  type ArmyState,
  BUILDING_SPECS,
  type BuildingId,
  type FactionId,
  getBuildingSpec,
  getResearchSpec,
  LEVY_RECRUIT_COST,
  LEVY_RECRUIT_STRENGTH,
  type ProvinceId,
  RESEARCH_SPECS,
  type ResearchId,
  type SettlementId,
  type WorldState,
} from "./model";

export function armyInProvince(state: WorldState, provinceId: ProvinceId): ArmyState | undefined {
  for (const armyId of Object.keys(state.armies).sort()) {
    const army = state.armies[armyId];
    if (army?.provinceId === provinceId) {
      return army;
    }
  }
  return undefined;
}

export function queuedOrderForArmy(state: WorldState, armyId: ArmyId) {
  return state.orderQueue.find((order) => order.command.armyId === armyId);
}

export function armyBlockingProvince(
  state: WorldState,
  provinceId: ProvinceId,
): ArmyState | undefined {
  const army = armyInProvince(state, provinceId);
  if (!army || queuedOrderForArmy(state, army.id)) {
    return undefined;
  }
  return army;
}

export function listLegalArmyDestinations(state: WorldState, armyId: ArmyId): ProvinceId[] {
  const army = state.armies[armyId];
  if (!army || army.movementPoints < 1) {
    return [];
  }
  const origin = state.provinces[army.provinceId];
  if (!origin) {
    return [];
  }
  return origin.neighborIds
    .filter((provinceId) => {
      if (!state.provinces[provinceId]) {
        return false;
      }
      const reserved = state.orderQueue.some(
        (order) =>
          order.command.armyId !== armyId && order.command.destinationProvinceId === provinceId,
      );
      if (reserved) {
        return false;
      }
      const occupant = armyBlockingProvince(state, provinceId);
      return occupant === undefined || occupant.ownerId !== army.ownerId;
    })
    .sort();
}

export function listArmyMovePreviews(state: WorldState, armyId: ArmyId): ArmyMovePreview[] {
  const army = state.armies[armyId];
  if (!army) {
    return [];
  }
  return listLegalArmyDestinations(state, armyId).map((provinceId) => {
    const occupant = armyBlockingProvince(state, provinceId);
    const province = state.provinces[provinceId];
    const willCapture = province !== undefined && province.ownerId !== army.ownerId;
    if (occupant && occupant.ownerId !== army.ownerId) {
      return {
        provinceId,
        kind: "field-battle",
        occupantArmyId: occupant.id,
        willCapture,
      };
    }
    return {
      provinceId,
      kind: "march",
      willCapture,
    };
  });
}

export function isPlayerFaction(state: WorldState, factionId: FactionId): boolean {
  return state.factions[factionId]?.isAi === false;
}

export function isProvinceVisible(
  state: WorldState,
  provinceId: ProvinceId,
  viewerFactionId: FactionId,
): boolean {
  const province = state.provinces[provinceId];
  if (!province) {
    return false;
  }
  if (province.ownerId === viewerFactionId) {
    return true;
  }
  const localArmy = armyInProvince(state, provinceId);
  if (localArmy?.ownerId === viewerFactionId) {
    return true;
  }
  for (const neighborId of [...province.neighborIds].sort()) {
    const neighbor = state.provinces[neighborId];
    if (neighbor?.ownerId === viewerFactionId) {
      return true;
    }
    const neighborArmy = armyInProvince(state, neighborId);
    if (neighborArmy?.ownerId === viewerFactionId) {
      return true;
    }
  }
  return false;
}

export function listRecruitableProvinces(state: WorldState, factionId: FactionId): ProvinceId[] {
  const faction = state.factions[factionId];
  if (!faction || faction.treasury < LEVY_RECRUIT_COST) {
    return [];
  }
  return Object.keys(state.provinces)
    .sort()
    .filter((provinceId) => {
      const province = state.provinces[provinceId];
      return province?.ownerId === factionId && armyInProvince(state, provinceId) === undefined;
    });
}

export function levyStrengthForFaction(state: WorldState, factionId: FactionId): number {
  let bonus = 0;
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (settlement?.ownerId !== factionId) {
      continue;
    }
    for (const buildingId of settlement.completedBuildingIds) {
      bonus += getBuildingSpec(buildingId)?.levyStrengthBonus ?? 0;
    }
  }
  return LEVY_RECRUIT_STRENGTH + bonus + researchBonus(state, factionId, "levyStrengthBonus");
}

export function buildingTreasuryDelta(state: WorldState, factionId: FactionId): number {
  let delta = 0;
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (settlement?.ownerId !== factionId) {
      continue;
    }
    for (const buildingId of settlement.completedBuildingIds) {
      delta += getBuildingSpec(buildingId)?.treasuryPerTurn ?? 0;
    }
  }
  return delta + researchBonus(state, factionId, "treasuryPerTurn");
}

export function unrestDeltaForProvince(state: WorldState, provinceId: ProvinceId): number {
  let delta = 0;
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (settlement?.provinceId !== provinceId) {
      continue;
    }
    for (const buildingId of settlement.completedBuildingIds) {
      delta += getBuildingSpec(buildingId)?.unrestPerTurn ?? 0;
    }
  }
  return delta;
}

export function foodBonusForProvince(state: WorldState, provinceId: ProvinceId): number {
  let bonus = 0;
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (settlement?.provinceId !== provinceId) {
      continue;
    }
    for (const buildingId of settlement.completedBuildingIds) {
      bonus += getBuildingSpec(buildingId)?.foodPerTurn ?? 0;
    }
  }
  const ownerId = state.provinces[provinceId]?.ownerId;
  const hasSettlement = Object.keys(state.settlements).some(
    (settlementId) => state.settlements[settlementId]?.provinceId === provinceId,
  );
  return bonus + (ownerId && hasSettlement ? researchBonus(state, ownerId, "foodPerTurn") : 0);
}

export function canQueueBuilding(
  state: WorldState,
  settlementId: SettlementId,
  buildingId: BuildingId,
): boolean {
  const spec = getBuildingSpec(buildingId);
  const settlement = state.settlements[settlementId];
  const faction = settlement ? state.factions[settlement.ownerId] : undefined;
  if (!spec || !settlement || !faction) {
    return false;
  }
  if (settlement.buildQueue) {
    return false;
  }
  if (settlement.completedBuildingIds.includes(buildingId)) {
    return false;
  }
  return faction.treasury >= spec.cost;
}

export function listQueueableBuildings(
  state: WorldState,
  settlementId: SettlementId,
): BuildingId[] {
  return Object.keys(BUILDING_SPECS)
    .sort()
    .filter((buildingId) => canQueueBuilding(state, settlementId, buildingId));
}

function researchBonus(
  state: WorldState,
  factionId: FactionId,
  field: "levyStrengthBonus" | "foodPerTurn" | "treasuryPerTurn",
): number {
  const faction = state.factions[factionId];
  if (!faction) {
    return 0;
  }
  let bonus = 0;
  for (const researchId of [...faction.completedResearchIds].sort()) {
    bonus += getResearchSpec(researchId)?.[field] ?? 0;
  }
  return bonus;
}

export function listSelectableResearch(state: WorldState, factionId: FactionId): ResearchId[] {
  const faction = state.factions[factionId];
  if (!faction || faction.researchQueue) {
    return [];
  }
  const completed = new Set(faction.completedResearchIds);
  return Object.keys(RESEARCH_SPECS)
    .sort()
    .filter((researchId) => {
      const spec = getResearchSpec(researchId);
      if (!spec || completed.has(researchId) || faction.treasury < spec.cost) {
        return false;
      }
      return spec.prerequisiteIds.every((prerequisiteId) => completed.has(prerequisiteId));
    });
}
