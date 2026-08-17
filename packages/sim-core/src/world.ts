import { stableHash } from "./canonical";
import {
  type ArmyState,
  type FactionState,
  getResearchSpec,
  LEVY_RECRUIT_COST,
  LEVY_RECRUIT_STRENGTH,
  type ProvinceState,
  startingCompletedResearch,
  WORLD_SCHEMA_VERSION,
  type WorldReadModel,
  type WorldState,
} from "./model";
import {
  isProvinceVisible,
  levyStrengthForFaction,
  listArmyMovePreviews,
  listLegalArmyDestinations,
  listQueueableBuildings,
  listRecruitableProvinces,
  listSelectableResearch,
  queuedOrderForArmy,
} from "./queries";
import { deriveSeed } from "./rng";

const UNORGANIZED_HOME = "faction.unorganized";
const CULTURAL_HOME_PREFIX = "faction.culture.";

function isAttestedHome(homeOwnerId: string): boolean {
  return homeOwnerId !== UNORGANIZED_HOME && !homeOwnerId.startsWith(CULTURAL_HOME_PREFIX);
}

export function createSampleWorld(seed = 10): WorldState {
  const factions: Record<string, FactionState> = {
    "faction.aurelia": {
      id: "faction.aurelia",
      name: "Aurelian Frontier",
      isAi: false,
      treasury: 120,
      completedResearchIds: startingCompletedResearch("faction.aurelia"),
    },
    "faction.arsacia": {
      id: "faction.arsacia",
      name: "Arsacian March",
      isAi: true,
      treasury: 110,
      completedResearchIds: startingCompletedResearch("faction.arsacia"),
    },
    "faction.orontes": {
      id: "faction.orontes",
      name: "Orontes League",
      isAi: true,
      treasury: 90,
      completedResearchIds: startingCompletedResearch("faction.orontes"),
    },
  };

  const provinces: Record<string, ProvinceState> = {
    "province.western-gate": {
      id: "province.western-gate",
      name: "Western Gate",
      ownerId: "faction.aurelia",
      homeOwnerId: "faction.aurelia",
      neighborIds: ["province.river-crossing"],
      food: 40,
      unrest: 5,
    },
    "province.river-crossing": {
      id: "province.river-crossing",
      name: "River Crossing",
      ownerId: "faction.orontes",
      homeOwnerId: "faction.orontes",
      neighborIds: ["province.eastern-march", "province.western-gate"],
      food: 35,
      unrest: 12,
    },
    "province.eastern-march": {
      id: "province.eastern-march",
      name: "Eastern March",
      ownerId: "faction.arsacia",
      homeOwnerId: "faction.arsacia",
      neighborIds: ["province.river-crossing"],
      food: 45,
      unrest: 7,
    },
  };

  const armies: Record<string, ArmyState> = {
    "army.first-frontier": {
      id: "army.first-frontier",
      name: "First Frontier Army",
      ownerId: "faction.aurelia",
      provinceId: "province.western-gate",
      strength: 1_200,
      movementPoints: 1,
      maxMovementPoints: 1,
    },
    "army.orontes-watch": {
      id: "army.orontes-watch",
      name: "Orontes Watch",
      ownerId: "faction.orontes",
      provinceId: "province.river-crossing",
      strength: 800,
      movementPoints: 1,
      maxMovementPoints: 1,
    },
    "army.arsacia-host": {
      id: "army.arsacia-host",
      name: "Arsacian Host",
      ownerId: "faction.arsacia",
      provinceId: "province.eastern-march",
      strength: 1_000,
      movementPoints: 1,
      maxMovementPoints: 1,
    },
  };

  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    contentVersion: "core.prototype.1",
    campaignId: `campaign.sample.${seed >>> 0}`,
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
    settlements: {
      "settlement.western-gate": {
        id: "settlement.western-gate",
        name: "Western Gate",
        provinceId: "province.western-gate",
        ownerId: "faction.aurelia",
        completedBuildingIds: [],
      },
    },
    orderQueue: [],
    acceptedCommandIds: [],
  };
}

export function cloneWorld(state: WorldState): WorldState {
  return JSON.parse(JSON.stringify(state)) as WorldState;
}

export function hashWorld(state: WorldState): string {
  return stableHash(state);
}

export function buildWorldReadModel(state: WorldState, viewerFactionId?: string): WorldReadModel {
  const viewer = viewerFactionId ?? "";
  const viewerId = viewerFactionId ?? "faction.aurelia";
  const owned = Object.values(state.provinces).filter((province) => province.ownerId === viewerId);
  const organized = Object.values(state.provinces).filter((province) =>
    isAttestedHome(province.homeOwnerId),
  );
  const theaterSecured =
    Object.keys(state.provinces).length <= 12
      ? owned.length === Object.keys(state.provinces).length
      : owned.length >= Math.max(24, Math.ceil(organized.length * 0.4));
  return {
    turn: state.turn,
    revision: state.revision,
    stateHash: hashWorld(state),
    theaterSecured,
    queuedOrders: state.orderQueue.map((order) => ({
      armyId: order.command.armyId,
      destinationProvinceId: order.command.destinationProvinceId,
    })),
    levyCost: LEVY_RECRUIT_COST,
    levyStrength: viewerFactionId
      ? levyStrengthForFaction(state, viewerFactionId)
      : LEVY_RECRUIT_STRENGTH,
    research: viewerResearch(state, viewerFactionId),
    recruitableProvinceIds: viewerFactionId ? listRecruitableProvinces(state, viewerFactionId) : [],
    factions: Object.keys(state.factions)
      .sort()
      .map((id) => {
        const faction = state.factions[id];
        if (!faction) {
          throw new Error(`Missing faction during read-model creation: ${id}`);
        }
        return {
          id: faction.id,
          name: faction.name,
          isAi: faction.isAi,
          ...(!viewerFactionId || faction.id === viewerFactionId
            ? { treasury: faction.treasury }
            : {}),
        };
      }),
    provinces: Object.keys(state.provinces)
      .sort()
      .map((id) => {
        const province = state.provinces[id];
        if (!province) {
          throw new Error(`Missing province during read-model creation: ${id}`);
        }
        const visible = !viewerFactionId || isProvinceVisible(state, province.id, viewer);
        return {
          id: province.id,
          name: visible ? province.name : "Unscouted land",
          neighborIds: [...province.neighborIds].sort(),
          visible,
          ownerId: province.ownerId,
          ...(visible ? { food: province.food, unrest: province.unrest } : {}),
        };
      }),
    armies: Object.keys(state.armies)
      .sort()
      .flatMap((id) => {
        const army = state.armies[id];
        if (!army) {
          throw new Error(`Missing army during read-model creation: ${id}`);
        }
        if (viewerFactionId && !isProvinceVisible(state, army.provinceId, viewer)) {
          return [];
        }
        const queued = queuedOrderForArmy(state, army.id);
        return [
          {
            id: army.id,
            name: army.name,
            ownerId: army.ownerId,
            provinceId: army.provinceId,
            strength: army.strength,
            movementPoints: army.movementPoints,
            legalDestinationIds: listLegalArmyDestinations(state, army.id),
            movePreviews: listArmyMovePreviews(state, army.id),
            ...(queued ? { queuedDestinationId: queued.command.destinationProvinceId } : {}),
          },
        ];
      }),
    settlements: Object.keys(state.settlements)
      .sort()
      .map((id) => {
        const settlement = state.settlements[id];
        if (!settlement) {
          throw new Error(`Missing settlement during read-model creation: ${id}`);
        }
        const visible = !viewerFactionId || isProvinceVisible(state, settlement.provinceId, viewer);
        return {
          id: settlement.id,
          name: visible ? settlement.name : "Unscouted settlement",
          provinceId: settlement.provinceId,
          ownerId: settlement.ownerId,
          completedBuildingIds: [...settlement.completedBuildingIds].sort(),
          visible,
          queueableBuildingIds:
            viewerFactionId && settlement.ownerId === viewer
              ? listQueueableBuildings(state, settlement.id)
              : [],
          ...(settlement.buildQueue ? { buildQueue: { ...settlement.buildQueue } } : {}),
        };
      }),
  };
}

function viewerResearch(
  state: WorldState,
  viewerFactionId: string | undefined,
): WorldReadModel["research"] {
  if (!viewerFactionId) {
    return { completedIds: [], selectable: [] };
  }
  const faction = state.factions[viewerFactionId];
  if (!faction) {
    return { completedIds: [], selectable: [] };
  }
  return {
    completedIds: [...faction.completedResearchIds].sort(),
    selectable: listSelectableResearch(state, viewerFactionId).map((researchId) => {
      const spec = getResearchSpec(researchId);
      return {
        id: researchId,
        label: spec?.label ?? researchId,
        cost: spec?.cost ?? 0,
        turns: spec?.turns ?? 0,
      };
    }),
    ...(faction.researchQueue ? { queue: { ...faction.researchQueue } } : {}),
  };
}
