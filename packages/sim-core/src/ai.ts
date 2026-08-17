import type { ArmyId, FactionId, ProvinceId, WorldState } from "./model";
import { armyInProvince, isPlayerFaction, listLegalArmyDestinations } from "./queries";

const UNORGANIZED_HOME = "faction.unorganized";
const CULTURAL_HOME_PREFIX = "faction.culture.";

export interface AiArmyMove {
  armyId: ArmyId;
  destinationProvinceId: ProvinceId;
  score: number;
}

export function chooseAiArmyMove(state: WorldState, factionId: FactionId): AiArmyMove | undefined {
  const faction = state.factions[factionId];
  if (!faction?.isAi) {
    return undefined;
  }

  let best: AiArmyMove | undefined;
  for (const armyId of Object.keys(state.armies).sort()) {
    const army = state.armies[armyId];
    if (!army || army.ownerId !== factionId) {
      continue;
    }
    for (const destinationProvinceId of listLegalArmyDestinations(state, army.id)) {
      const score = scoreAiDestination(state, army.id, destinationProvinceId);
      if (score === undefined) {
        continue;
      }
      const candidate: AiArmyMove = { armyId: army.id, destinationProvinceId, score };
      if (isBetterAiMove(candidate, best)) {
        best = candidate;
      }
    }
  }
  return best;
}

function scoreAiDestination(
  state: WorldState,
  armyId: ArmyId,
  destinationProvinceId: ProvinceId,
): number | undefined {
  const army = state.armies[armyId];
  const province = state.provinces[destinationProvinceId];
  if (!army || !province) {
    return undefined;
  }
  const occupant = armyInProvince(state, destinationProvinceId);
  const playerId = playerFactionId(state);
  if (occupant) {
    if (!isPlayerFaction(state, occupant.ownerId)) {
      return undefined;
    }
    if (occupant.strength >= army.strength) {
      return undefined;
    }
    if (playerId && province.homeOwnerId === playerId) {
      return undefined;
    }
    return 30;
  }
  if (isPlayerFaction(state, province.ownerId)) {
    if (province.homeOwnerId === army.ownerId) {
      return 40;
    }
    if (
      playerId &&
      province.homeOwnerId !== playerId &&
      province.homeOwnerId !== UNORGANIZED_HOME &&
      !province.homeOwnerId.startsWith(CULTURAL_HOME_PREFIX)
    ) {
      return 40;
    }
    return undefined;
  }
  return undefined;
}

function playerFactionId(state: WorldState): FactionId | undefined {
  for (const factionId of Object.keys(state.factions).sort()) {
    if (state.factions[factionId]?.isAi === false) {
      return factionId;
    }
  }
  return undefined;
}

function isBetterAiMove(candidate: AiArmyMove, current: AiArmyMove | undefined): boolean {
  if (!current) {
    return true;
  }
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }
  if (candidate.armyId !== current.armyId) {
    return candidate.armyId < current.armyId;
  }
  return candidate.destinationProvinceId < current.destinationProvinceId;
}
