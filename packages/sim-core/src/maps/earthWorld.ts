import type { ArmyState, FactionState, ProvinceState, SettlementState, WorldState } from "../model";
import { startingCompletedResearch, WORLD_SCHEMA_VERSION } from "../model";
import { deriveSeed } from "../rng";
import earthPack from "./earth84bce.json" with { type: "json" };

export interface EarthFactionRecord {
  id: string;
  name: string;
  playable: boolean;
  government: string;
  color: number;
  capitalId: string;
  layer?: "attested" | "cultural";
}

export interface EarthProvinceRecord {
  id: string;
  name: string;
  named: boolean;
  ownerId: string;
  col: number;
  row: number;
  lon: number;
  lat: number;
  neighborIds: string[];
  food: number;
  unrest: number;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
}

export interface EarthMapPack {
  schemaVersion: number;
  dateLabel: string;
  source: { name: string; url: string; license: string; note: string };
  cellDegrees: number;
  mapScale: number;
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
  latTop: number;
  mapWidth: number;
  mapHeight: number;
  factions: EarthFactionRecord[];
  provinces: EarthProvinceRecord[];
}

export const EARTH_MAP = earthPack as EarthMapPack;
export const ROME_FACTION_ID = "faction.rome";
export const UNORGANIZED_FACTION_ID = "faction.unorganized";
export const EARTH_CONTENT_VERSION = "earth.84bce.5";

export function listPlayableFactions(): EarthFactionRecord[] {
  return EARTH_MAP.factions.filter((faction) => faction.playable);
}

export function isEarthPackCompatible(state: {
  contentVersion: string;
  provinces: object;
}): boolean {
  if (!state.contentVersion.startsWith("earth.")) {
    return true;
  }
  return (
    state.contentVersion === EARTH_CONTENT_VERSION &&
    Object.keys(state.provinces).length === EARTH_MAP.provinces.length
  );
}

function startingTreasury(factionId: string, playerFactionId: string): number {
  if (factionId === UNORGANIZED_FACTION_ID || factionId.startsWith("faction.culture.")) {
    return 0;
  }
  return factionId === playerFactionId ? 220 : 110;
}

export function createEarthWorld(seed = 84, playerFactionId = ROME_FACTION_ID): WorldState {
  const factions: Record<string, FactionState> = {};
  for (const faction of EARTH_MAP.factions) {
    factions[faction.id] = {
      id: faction.id,
      name: faction.name,
      isAi: faction.id !== playerFactionId,
      treasury: startingTreasury(faction.id, playerFactionId),
      completedResearchIds: startingCompletedResearch(faction.id),
    };
  }

  const provinces: Record<string, ProvinceState> = {};
  for (const province of EARTH_MAP.provinces) {
    provinces[province.id] = {
      id: province.id,
      name: province.name,
      ownerId: province.ownerId,
      homeOwnerId: province.ownerId,
      neighborIds: [...province.neighborIds],
      food: province.food,
      unrest: province.unrest,
    };
  }

  const armies: Record<string, ArmyState> = {};
  for (const faction of EARTH_MAP.factions) {
    if (!faction.playable) {
      continue;
    }
    const home =
      provinces[faction.capitalId] ??
      Object.values(provinces).find((province) => province.ownerId === faction.id);
    if (!home) {
      continue;
    }
    const armyId = `army.${faction.id.replace("faction.", "")}.field`;
    armies[armyId] = {
      id: armyId,
      name: `${faction.name} field army`,
      ownerId: faction.id,
      provinceId: home.id,
      strength: faction.id === ROME_FACTION_ID ? 1_600 : 900,
      movementPoints: 1,
      maxMovementPoints: 1,
    };
  }

  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    contentVersion: EARTH_CONTENT_VERSION,
    campaignId: `campaign.earth84.${seed >>> 0}`,
    seed: seed >>> 0,
    turn: 1,
    phase: "planning",
    revision: 0,
    eventSequence: 0,
    rngStreams: {
      strategicEvents: deriveSeed(seed, "strategic-events"),
      ai: deriveSeed(seed, "ai"),
    },
    factions,
    provinces,
    armies,
    settlements: capitalSettlements(provinces),
    orderQueue: [],
    acceptedCommandIds: [],
  };
}

function capitalSettlements(
  provinces: Record<string, ProvinceState>,
): Record<string, SettlementState> {
  const settlements: Record<string, SettlementState> = {};
  for (const faction of EARTH_MAP.factions) {
    if (!faction.capitalId) {
      continue;
    }
    const home = provinces[faction.capitalId];
    if (!home) {
      continue;
    }
    const settlementId = `settlement.${home.id.replace("province.", "")}`;
    settlements[settlementId] = {
      id: settlementId,
      name: home.name,
      provinceId: home.id,
      ownerId: home.ownerId,
      completedBuildingIds: [],
    };
  }
  return settlements;
}
