export const WORLD_SCHEMA_VERSION = 1 as const;

export type FactionId = string;
export type ProvinceId = string;
export type ArmyId = string;
export type SettlementId = string;
export type BuildingId = string;
export type ResearchId = string;
export type CommandId = string;

export type StrategicPhase = "planning" | "resolution";

export interface RngStreams {
  strategicEvents: number;
  ai: number;
}

export interface ResearchQueue {
  researchId: ResearchId;
  remainingTurns: number;
}

export interface FactionState {
  id: FactionId;
  name: string;
  isAi: boolean;
  treasury: number;
  completedResearchIds: ResearchId[];
  researchQueue?: ResearchQueue;
}

export interface ProvinceState {
  id: ProvinceId;
  name: string;
  ownerId: FactionId;
  homeOwnerId: FactionId;
  neighborIds: ProvinceId[];
  food: number;
  unrest: number;
}

export interface ArmyState {
  id: ArmyId;
  name: string;
  ownerId: FactionId;
  provinceId: ProvinceId;
  strength: number;
  movementPoints: number;
  maxMovementPoints: number;
}

export interface SettlementBuildQueue {
  buildingId: BuildingId;
  remainingTurns: number;
}

export interface SettlementState {
  id: SettlementId;
  name: string;
  provinceId: ProvinceId;
  ownerId: FactionId;
  completedBuildingIds: BuildingId[];
  buildQueue?: SettlementBuildQueue;
}

export interface WorldState {
  schemaVersion: typeof WORLD_SCHEMA_VERSION;
  contentVersion: string;
  campaignId: string;
  seed: number;
  turn: number;
  phase: StrategicPhase;
  revision: number;
  eventSequence: number;
  rngStreams: RngStreams;
  factions: Record<FactionId, FactionState>;
  provinces: Record<ProvinceId, ProvinceState>;
  armies: Record<ArmyId, ArmyState>;
  settlements: Record<SettlementId, SettlementState>;
  orderQueue: QueuedOrder[];
  acceptedCommandIds: CommandId[];
}

export interface QueuedOrder {
  id: CommandId;
  actorFactionId: FactionId;
  command: MoveArmyCommand;
}

export interface CommandEnvelope<TCommand extends WorldCommand = WorldCommand> {
  id: CommandId;
  actorFactionId: FactionId;
  expectedRevision: number;
  command: TCommand;
}

export type WorldCommand =
  | MoveArmyCommand
  | EndTurnCommand
  | RecruitArmyCommand
  | QueueBuildingCommand
  | CancelOrderCommand
  | SelectResearchCommand;

export interface MoveArmyCommand {
  type: "army.move";
  armyId: ArmyId;
  destinationProvinceId: ProvinceId;
}

export interface EndTurnCommand {
  type: "strategic.end-turn";
}

export interface RecruitArmyCommand {
  type: "army.recruit";
  provinceId: ProvinceId;
}

export interface QueueBuildingCommand {
  type: "settlement.queue-building";
  settlementId: SettlementId;
  buildingId: BuildingId;
}

export interface CancelOrderCommand {
  type: "order.cancel";
  armyId: ArmyId;
}

export interface SelectResearchCommand {
  type: "research.select";
  researchId: ResearchId;
}

export const LEVY_RECRUIT_COST = 80;
export const LEVY_RECRUIT_STRENGTH = 600;
export const STOREHOUSE_BUILDING_ID = "storehouse";
export const STOREHOUSE_COST = 80;
export const STOREHOUSE_TURNS = 2;
export const STOREHOUSE_FOOD_PER_TURN = 3;
export const TRAINING_GROUND_BUILDING_ID = "training-ground";
export const TRAINING_GROUND_COST = 110;
export const TRAINING_GROUND_TURNS = 3;
export const TRAINING_GROUND_LEVY_BONUS = 200;
export const CIVIC_HALL_BUILDING_ID = "civic-hall";
export const CIVIC_HALL_COST = 90;
export const CIVIC_HALL_TURNS = 2;
export const CIVIC_HALL_TREASURY_PER_TURN = 2;
export const CIVIC_HALL_UNREST_PER_TURN = -1;
export const ARMY_UPKEEP_PER_ARMY = 2;
export const ORGANIZED_LOGISTICS_ID = "organized-logistics";
export const COMPOSITE_BOW_DOCTRINE_ID = "composite-bow-doctrine";
export const RITUAL_ASTRONOMY_ID = "ritual-astronomy";
export const COMPOSITE_BOW_LEVY_BONUS = 100;
export const RITUAL_ASTRONOMY_FOOD_PER_TURN = 1;

export interface ResearchSpec {
  id: ResearchId;
  label: string;
  cost: number;
  turns: number;
  prerequisiteIds: ResearchId[];
  levyStrengthBonus: number;
  foodPerTurn: number;
  treasuryPerTurn: number;
}

export const RESEARCH_SPECS: Record<string, ResearchSpec> = {
  [ORGANIZED_LOGISTICS_ID]: {
    id: ORGANIZED_LOGISTICS_ID,
    label: "Organized Logistics",
    cost: 60,
    turns: 2,
    prerequisiteIds: [],
    levyStrengthBonus: 0,
    foodPerTurn: 0,
    treasuryPerTurn: 0,
  },
  [COMPOSITE_BOW_DOCTRINE_ID]: {
    id: COMPOSITE_BOW_DOCTRINE_ID,
    label: "Composite Bow Doctrine",
    cost: 100,
    turns: 3,
    prerequisiteIds: [ORGANIZED_LOGISTICS_ID],
    levyStrengthBonus: COMPOSITE_BOW_LEVY_BONUS,
    foodPerTurn: 0,
    treasuryPerTurn: 0,
  },
  [RITUAL_ASTRONOMY_ID]: {
    id: RITUAL_ASTRONOMY_ID,
    label: "Ritual Astronomy",
    cost: 120,
    turns: 3,
    prerequisiteIds: [ORGANIZED_LOGISTICS_ID],
    levyStrengthBonus: 0,
    foodPerTurn: RITUAL_ASTRONOMY_FOOD_PER_TURN,
    treasuryPerTurn: 0,
  },
};

export function getResearchSpec(researchId: string): ResearchSpec | undefined {
  return RESEARCH_SPECS[researchId];
}

export function startingCompletedResearch(factionId: string): ResearchId[] {
  if (factionId === "faction.unorganized" || factionId.startsWith("faction.culture.")) {
    return [];
  }
  return [ORGANIZED_LOGISTICS_ID];
}

export interface BuildingSpec {
  id: BuildingId;
  label: string;
  cost: number;
  turns: number;
  foodPerTurn: number;
  levyStrengthBonus: number;
  treasuryPerTurn: number;
  unrestPerTurn: number;
}

export const BUILDING_SPECS: Record<string, BuildingSpec> = {
  [STOREHOUSE_BUILDING_ID]: {
    id: STOREHOUSE_BUILDING_ID,
    label: "storehouse",
    cost: STOREHOUSE_COST,
    turns: STOREHOUSE_TURNS,
    foodPerTurn: STOREHOUSE_FOOD_PER_TURN,
    levyStrengthBonus: 0,
    treasuryPerTurn: 0,
    unrestPerTurn: 0,
  },
  [TRAINING_GROUND_BUILDING_ID]: {
    id: TRAINING_GROUND_BUILDING_ID,
    label: "training ground",
    cost: TRAINING_GROUND_COST,
    turns: TRAINING_GROUND_TURNS,
    foodPerTurn: 0,
    levyStrengthBonus: TRAINING_GROUND_LEVY_BONUS,
    treasuryPerTurn: -1,
    unrestPerTurn: 0,
  },
  [CIVIC_HALL_BUILDING_ID]: {
    id: CIVIC_HALL_BUILDING_ID,
    label: "civic hall",
    cost: CIVIC_HALL_COST,
    turns: CIVIC_HALL_TURNS,
    foodPerTurn: 0,
    levyStrengthBonus: 0,
    treasuryPerTurn: CIVIC_HALL_TREASURY_PER_TURN,
    unrestPerTurn: CIVIC_HALL_UNREST_PER_TURN,
  },
};

export function getBuildingSpec(buildingId: string): BuildingSpec | undefined {
  return BUILDING_SPECS[buildingId];
}

export interface ArmyMovedEvent {
  type: "army.moved";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  fromProvinceId: ProvinceId;
  toProvinceId: ProvinceId;
  movementPointsRemaining: number;
}

export interface ProvinceHarvestedEvent {
  type: "province.harvested";
  sequence: number;
  turn: number;
  provinceId: ProvinceId;
  foodDelta: number;
}

export interface TurnAdvancedEvent {
  type: "turn.advanced";
  sequence: number;
  turn: number;
  previousTurn: number;
}

export interface ProvinceCapturedEvent {
  type: "province.captured";
  sequence: number;
  turn: number;
  provinceId: ProvinceId;
  armyId: ArmyId;
  previousOwnerId: FactionId;
  ownerId: FactionId;
}

export interface BattleResolvedEvent {
  type: "battle.resolved";
  sequence: number;
  turn: number;
  provinceId: ProvinceId;
  attackerArmyId: ArmyId;
  defenderArmyId: ArmyId;
  winnerArmyId: ArmyId;
  loserArmyId: ArmyId;
  winnerCasualties: number;
  loserDestroyed: boolean;
}

export interface ArmyDestroyedEvent {
  type: "army.destroyed";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  provinceId: ProvinceId;
  ownerId: FactionId;
}

export interface ArmyRecruitedEvent {
  type: "army.recruited";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  provinceId: ProvinceId;
  ownerId: FactionId;
  strength: number;
  treasurySpent: number;
}

export interface SettlementQueuedEvent {
  type: "settlement.queued";
  sequence: number;
  turn: number;
  settlementId: SettlementId;
  buildingId: BuildingId;
  remainingTurns: number;
  treasurySpent: number;
}

export interface SettlementConstructedEvent {
  type: "settlement.constructed";
  sequence: number;
  turn: number;
  settlementId: SettlementId;
  buildingId: BuildingId;
  provinceId: ProvinceId;
}

export interface FactionUpkeepEvent {
  type: "faction.upkeep";
  sequence: number;
  turn: number;
  factionId: FactionId;
  treasuryDelta: number;
  armyCount: number;
}

export interface OrderQueuedEvent {
  type: "order.queued";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  destinationProvinceId: ProvinceId;
}

export interface OrderCancelledEvent {
  type: "order.cancelled";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  destinationProvinceId: ProvinceId;
}

export interface OrderFailedEvent {
  type: "order.failed";
  sequence: number;
  turn: number;
  armyId: ArmyId;
  destinationProvinceId: ProvinceId;
  reason: CommandFailureCode;
}

export interface ResearchQueuedEvent {
  type: "research.queued";
  sequence: number;
  turn: number;
  factionId: FactionId;
  researchId: ResearchId;
  remainingTurns: number;
  treasurySpent: number;
}

export interface ResearchCompletedEvent {
  type: "research.completed";
  sequence: number;
  turn: number;
  factionId: FactionId;
  researchId: ResearchId;
}

export type WorldEvent =
  | ArmyMovedEvent
  | ProvinceHarvestedEvent
  | TurnAdvancedEvent
  | ProvinceCapturedEvent
  | BattleResolvedEvent
  | ArmyDestroyedEvent
  | ArmyRecruitedEvent
  | SettlementQueuedEvent
  | SettlementConstructedEvent
  | FactionUpkeepEvent
  | OrderQueuedEvent
  | OrderCancelledEvent
  | OrderFailedEvent
  | ResearchQueuedEvent
  | ResearchCompletedEvent;

export type CommandFailureCode =
  | "revision-conflict"
  | "duplicate-command"
  | "unknown-actor"
  | "unknown-army"
  | "not-owner"
  | "unknown-province"
  | "not-adjacent"
  | "insufficient-movement"
  | "invalid-phase"
  | "occupied-by-ally"
  | "insufficient-treasury"
  | "unknown-settlement"
  | "unknown-building"
  | "already-building"
  | "already-built"
  | "order-conflict"
  | "no-queued-order"
  | "unknown-research"
  | "already-researching"
  | "already-researched"
  | "missing-prerequisite";

export interface ArmyMovePreview {
  provinceId: ProvinceId;
  kind: "march" | "field-battle";
  occupantArmyId?: ArmyId;
  willCapture: boolean;
}

export interface CommandFailure {
  code: CommandFailureCode;
  message: string;
}

export type CommandResult =
  | {
      ok: true;
      state: WorldState;
      events: WorldEvent[];
      stateHash: string;
    }
  | {
      ok: false;
      error: CommandFailure;
    };

export interface WorldReadModel {
  turn: number;
  revision: number;
  stateHash: string;
  theaterSecured: boolean;
  recruitableProvinceIds: ProvinceId[];
  factions: Array<Pick<FactionState, "id" | "name" | "isAi"> & { treasury?: number }>;
  provinces: Array<
    Pick<ProvinceState, "id" | "name" | "neighborIds"> & {
      visible: boolean;
      ownerId?: FactionId;
      food?: number;
      unrest?: number;
    }
  >;
  queuedOrders: Array<{ armyId: ArmyId; destinationProvinceId: ProvinceId }>;
  armies: Array<
    Pick<ArmyState, "id" | "name" | "ownerId" | "provinceId" | "strength" | "movementPoints"> & {
      legalDestinationIds: ProvinceId[];
      movePreviews: ArmyMovePreview[];
      queuedDestinationId?: ProvinceId;
    }
  >;
  levyCost: number;
  levyStrength: number;
  research: {
    completedIds: ResearchId[];
    selectable: Array<{
      id: ResearchId;
      label: string;
      cost: number;
      turns: number;
    }>;
    queue?: ResearchQueue;
  };
  settlements: Array<
    Pick<SettlementState, "id" | "name" | "provinceId" | "ownerId" | "completedBuildingIds"> & {
      visible: boolean;
      queueableBuildingIds: BuildingId[];
      buildQueue?: SettlementBuildQueue;
    }
  >;
}
