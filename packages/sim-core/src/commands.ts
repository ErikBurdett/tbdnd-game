import { chooseAiArmyMove } from "./ai";
import { assertWorldInvariants } from "./invariants";
import {
  ARMY_UPKEEP_PER_ARMY,
  type ArmyState,
  type CancelOrderCommand,
  type CommandEnvelope,
  type CommandFailure,
  type CommandResult,
  type EndTurnCommand,
  getBuildingSpec,
  getResearchSpec,
  LEVY_RECRUIT_COST,
  type MoveArmyCommand,
  type ProvinceId,
  type QueueBuildingCommand,
  type RecruitArmyCommand,
  type SelectResearchCommand,
  type WorldEvent,
  type WorldState,
} from "./model";
import {
  armyBlockingProvince,
  armyInProvince,
  buildingTreasuryDelta,
  foodBonusForProvince,
  levyStrengthForFaction,
  queuedOrderForArmy,
  unrestDeltaForProvince,
} from "./queries";
import { Rng32 } from "./rng";
import { hashWorld } from "./world";

const HARVEST_EVENT_PROVINCE_LIMIT = 12;
const UNORGANIZED_FACTION_ID = "faction.unorganized";
const CULTURAL_HOME_PREFIX = "faction.culture.";

const WINNER_CASUALTY_DIVISOR = 10;

function failure(code: CommandFailure["code"], message: string): CommandResult {
  return { ok: false, error: { code, message } };
}

function nextSequence(state: WorldState): number {
  state.eventSequence += 1;
  return state.eventSequence;
}

function validateEnvelope(
  state: WorldState,
  envelope: CommandEnvelope,
): CommandFailure | undefined {
  if (envelope.expectedRevision !== state.revision) {
    return {
      code: "revision-conflict",
      message: `Expected revision ${envelope.expectedRevision}, but the world is at ${state.revision}.`,
    };
  }
  if (state.acceptedCommandIds.includes(envelope.id)) {
    return {
      code: "duplicate-command",
      message: `Command ${envelope.id} has already been accepted.`,
    };
  }
  if (!state.factions[envelope.actorFactionId]) {
    return {
      code: "unknown-actor",
      message: `Faction ${envelope.actorFactionId} does not exist.`,
    };
  }
  if (state.phase !== "planning") {
    return {
      code: "invalid-phase",
      message: `Command ${envelope.command.type} is not legal during ${state.phase}.`,
    };
  }
  return undefined;
}

function validateMoveArmy(
  state: WorldState,
  envelope: CommandEnvelope<MoveArmyCommand>,
): CommandFailure | undefined {
  const army = state.armies[envelope.command.armyId];
  if (!army) {
    return {
      code: "unknown-army",
      message: `Army ${envelope.command.armyId} does not exist.`,
    };
  }
  if (army.ownerId !== envelope.actorFactionId) {
    return {
      code: "not-owner",
      message: `Faction ${envelope.actorFactionId} does not control army ${army.id}.`,
    };
  }
  if (!state.provinces[envelope.command.destinationProvinceId]) {
    return {
      code: "unknown-province",
      message: `Province ${envelope.command.destinationProvinceId} does not exist.`,
    };
  }
  const origin = state.provinces[army.provinceId];
  if (!origin) {
    throw new Error(`Army ${army.id} is in missing province ${army.provinceId}.`);
  }
  if (!origin.neighborIds.includes(envelope.command.destinationProvinceId)) {
    return {
      code: "not-adjacent",
      message: `${envelope.command.destinationProvinceId} is not adjacent to ${origin.id}.`,
    };
  }
  if (army.movementPoints < 1) {
    return {
      code: "insufficient-movement",
      message: `Army ${army.id} has no movement points remaining.`,
    };
  }
  const reserved = state.orderQueue.some(
    (order) =>
      order.command.armyId !== army.id &&
      order.command.destinationProvinceId === envelope.command.destinationProvinceId,
  );
  if (reserved) {
    return {
      code: "order-conflict",
      message: `${envelope.command.destinationProvinceId} is already the target of another order.`,
    };
  }
  const occupant = armyBlockingProvince(state, envelope.command.destinationProvinceId);
  if (occupant && occupant.ownerId === army.ownerId) {
    return {
      code: "occupied-by-ally",
      message: `${envelope.command.destinationProvinceId} already holds ${occupant.id}.`,
    };
  }
  return undefined;
}

function validateRecruitArmy(
  state: WorldState,
  envelope: CommandEnvelope<RecruitArmyCommand>,
): CommandFailure | undefined {
  const province = state.provinces[envelope.command.provinceId];
  if (!province) {
    return {
      code: "unknown-province",
      message: `Province ${envelope.command.provinceId} does not exist.`,
    };
  }
  if (province.ownerId !== envelope.actorFactionId) {
    return {
      code: "not-owner",
      message: `Faction ${envelope.actorFactionId} does not control ${province.id}.`,
    };
  }
  const occupant = armyInProvince(state, province.id);
  if (occupant) {
    return {
      code: "occupied-by-ally",
      message: `${province.id} already holds ${occupant.id}.`,
    };
  }
  const faction = state.factions[envelope.actorFactionId];
  if (!faction) {
    return {
      code: "unknown-actor",
      message: `Faction ${envelope.actorFactionId} does not exist.`,
    };
  }
  if (faction.treasury < LEVY_RECRUIT_COST) {
    return {
      code: "insufficient-treasury",
      message: `Recruiting a levy costs ${LEVY_RECRUIT_COST} treasury.`,
    };
  }
  return undefined;
}

function applyRecruitArmy(
  state: WorldState,
  envelope: CommandEnvelope<RecruitArmyCommand>,
): WorldEvent[] {
  const province = state.provinces[envelope.command.provinceId];
  const faction = state.factions[envelope.actorFactionId];
  if (!province || !faction) {
    throw new Error("Recruit command was applied without a validated province.");
  }
  const armyId = `army.levy.${state.eventSequence + 1}`;
  const strength = levyStrengthForFaction(state, faction.id);
  state.armies[armyId] = {
    id: armyId,
    name: `${province.name} Levy`,
    ownerId: faction.id,
    provinceId: province.id,
    strength,
    movementPoints: 1,
    maxMovementPoints: 1,
  };
  faction.treasury -= LEVY_RECRUIT_COST;
  return [
    {
      type: "army.recruited",
      sequence: nextSequence(state),
      turn: state.turn,
      armyId,
      provinceId: province.id,
      ownerId: faction.id,
      strength,
      treasurySpent: LEVY_RECRUIT_COST,
    },
  ];
}

function validateQueueBuilding(
  state: WorldState,
  envelope: CommandEnvelope<QueueBuildingCommand>,
): CommandFailure | undefined {
  const settlement = state.settlements[envelope.command.settlementId];
  if (!settlement) {
    return {
      code: "unknown-settlement",
      message: `Settlement ${envelope.command.settlementId} does not exist.`,
    };
  }
  if (settlement.ownerId !== envelope.actorFactionId) {
    return {
      code: "not-owner",
      message: `Faction ${envelope.actorFactionId} does not control ${settlement.id}.`,
    };
  }
  const spec = getBuildingSpec(envelope.command.buildingId);
  if (!spec) {
    return {
      code: "unknown-building",
      message: `Building ${envelope.command.buildingId} is not available.`,
    };
  }
  if (settlement.buildQueue) {
    return {
      code: "already-building",
      message: `${settlement.id} is already constructing ${settlement.buildQueue.buildingId}.`,
    };
  }
  if (settlement.completedBuildingIds.includes(spec.id)) {
    return {
      code: "already-built",
      message: `${settlement.id} already has a ${spec.label}.`,
    };
  }
  const faction = state.factions[envelope.actorFactionId];
  if (!faction) {
    return {
      code: "unknown-actor",
      message: `Faction ${envelope.actorFactionId} does not exist.`,
    };
  }
  if (faction.treasury < spec.cost) {
    return {
      code: "insufficient-treasury",
      message: `A ${spec.label} costs ${spec.cost} treasury.`,
    };
  }
  return undefined;
}

function applyQueueBuilding(
  state: WorldState,
  envelope: CommandEnvelope<QueueBuildingCommand>,
): WorldEvent[] {
  const settlement = state.settlements[envelope.command.settlementId];
  const faction = state.factions[envelope.actorFactionId];
  if (!settlement || !faction) {
    throw new Error("Queue-building command was applied without a validated settlement.");
  }
  const spec = getBuildingSpec(envelope.command.buildingId);
  if (!spec) {
    throw new Error("Queue-building command was applied without a validated building.");
  }
  faction.treasury -= spec.cost;
  settlement.buildQueue = {
    buildingId: spec.id,
    remainingTurns: spec.turns,
  };
  return [
    {
      type: "settlement.queued",
      sequence: nextSequence(state),
      turn: state.turn,
      settlementId: settlement.id,
      buildingId: spec.id,
      remainingTurns: spec.turns,
      treasurySpent: spec.cost,
    },
  ];
}

function progressSettlementQueues(state: WorldState, turn: number): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (!settlement?.buildQueue) {
      continue;
    }
    settlement.buildQueue.remainingTurns -= 1;
    if (settlement.buildQueue.remainingTurns > 0) {
      continue;
    }
    const buildingId = settlement.buildQueue.buildingId;
    settlement.completedBuildingIds.push(buildingId);
    settlement.completedBuildingIds.sort();
    delete settlement.buildQueue;
    events.push({
      type: "settlement.constructed",
      sequence: nextSequence(state),
      turn,
      settlementId: settlement.id,
      buildingId,
      provinceId: settlement.provinceId,
    });
  }
  return events;
}

function validateSelectResearch(
  state: WorldState,
  envelope: CommandEnvelope<SelectResearchCommand>,
): CommandFailure | undefined {
  const spec = getResearchSpec(envelope.command.researchId);
  if (!spec) {
    return {
      code: "unknown-research",
      message: `Research ${envelope.command.researchId} is not available.`,
    };
  }
  const faction = state.factions[envelope.actorFactionId];
  if (!faction) {
    return {
      code: "unknown-actor",
      message: `Faction ${envelope.actorFactionId} does not exist.`,
    };
  }
  if (faction.researchQueue) {
    return {
      code: "already-researching",
      message: `${faction.id} is already researching ${faction.researchQueue.researchId}.`,
    };
  }
  if (faction.completedResearchIds.includes(spec.id)) {
    return {
      code: "already-researched",
      message: `${faction.id} already knows ${spec.label}.`,
    };
  }
  const completed = new Set(faction.completedResearchIds);
  const missing = spec.prerequisiteIds.find((prerequisiteId) => !completed.has(prerequisiteId));
  if (missing) {
    return {
      code: "missing-prerequisite",
      message: `${spec.label} requires ${missing}.`,
    };
  }
  if (faction.treasury < spec.cost) {
    return {
      code: "insufficient-treasury",
      message: `${spec.label} costs ${spec.cost} treasury.`,
    };
  }
  return undefined;
}

function applySelectResearch(
  state: WorldState,
  envelope: CommandEnvelope<SelectResearchCommand>,
): WorldEvent[] {
  const spec = getResearchSpec(envelope.command.researchId);
  const faction = state.factions[envelope.actorFactionId];
  if (!spec || !faction) {
    throw new Error("Research command was applied without a validated faction.");
  }
  faction.treasury -= spec.cost;
  faction.researchQueue = {
    researchId: spec.id,
    remainingTurns: spec.turns,
  };
  return [
    {
      type: "research.queued",
      sequence: nextSequence(state),
      turn: state.turn,
      factionId: faction.id,
      researchId: spec.id,
      remainingTurns: spec.turns,
      treasurySpent: spec.cost,
    },
  ];
}

function progressResearchQueues(state: WorldState, turn: number): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (const factionId of Object.keys(state.factions).sort()) {
    const faction = state.factions[factionId];
    if (!faction?.researchQueue) {
      continue;
    }
    faction.researchQueue.remainingTurns -= 1;
    if (faction.researchQueue.remainingTurns > 0) {
      continue;
    }
    const researchId = faction.researchQueue.researchId;
    faction.completedResearchIds.push(researchId);
    faction.completedResearchIds.sort();
    delete faction.researchQueue;
    events.push({
      type: "research.completed",
      sequence: nextSequence(state),
      turn,
      factionId: faction.id,
      researchId,
    });
  }
  return events;
}

function captureIfForeign(
  state: WorldState,
  army: ArmyState,
  provinceId: ProvinceId,
): WorldEvent[] {
  const destination = state.provinces[provinceId];
  if (!destination) {
    throw new Error(`Army ${army.id} marched into missing province ${provinceId}.`);
  }
  if (destination.ownerId === army.ownerId) {
    return [];
  }
  const previousOwnerId = destination.ownerId;
  destination.ownerId = army.ownerId;
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (settlement?.provinceId === destination.id) {
      settlement.ownerId = army.ownerId;
    }
  }
  return [
    {
      type: "province.captured",
      sequence: nextSequence(state),
      turn: state.turn,
      provinceId: destination.id,
      armyId: army.id,
      previousOwnerId,
      ownerId: army.ownerId,
    },
  ];
}

function destroyArmy(state: WorldState, army: ArmyState): WorldEvent {
  const event: WorldEvent = {
    type: "army.destroyed",
    sequence: nextSequence(state),
    turn: state.turn,
    armyId: army.id,
    provinceId: army.provinceId,
    ownerId: army.ownerId,
  };
  delete state.armies[army.id];
  return event;
}

function resolveFieldBattle(
  state: WorldState,
  attacker: ArmyState,
  defender: ArmyState,
  provinceId: ProvinceId,
): WorldEvent[] {
  const attackerWins = attacker.strength > defender.strength;
  const winner = attackerWins ? attacker : defender;
  const loser = attackerWins ? defender : attacker;
  const winnerCasualties = Math.max(1, Math.floor(loser.strength / WINNER_CASUALTY_DIVISOR));
  winner.strength = Math.max(1, winner.strength - winnerCasualties);

  const events: WorldEvent[] = [
    {
      type: "battle.resolved",
      sequence: nextSequence(state),
      turn: state.turn,
      provinceId,
      attackerArmyId: attacker.id,
      defenderArmyId: defender.id,
      winnerArmyId: winner.id,
      loserArmyId: loser.id,
      winnerCasualties,
      loserDestroyed: true,
    },
    destroyArmy(state, loser),
  ];

  if (!attackerWins) {
    return events;
  }

  const fromProvinceId = attacker.provinceId;
  attacker.provinceId = provinceId;
  events.push({
    type: "army.moved",
    sequence: nextSequence(state),
    turn: state.turn,
    armyId: attacker.id,
    fromProvinceId,
    toProvinceId: provinceId,
    movementPointsRemaining: attacker.movementPoints,
  });
  events.push(...captureIfForeign(state, attacker, provinceId));
  return events;
}

function applyArmyMarch(
  state: WorldState,
  army: ArmyState,
  destinationProvinceId: ProvinceId,
): WorldEvent[] {
  army.movementPoints -= 1;
  const occupant = armyInProvince(state, destinationProvinceId);
  if (occupant && occupant.ownerId !== army.ownerId) {
    return resolveFieldBattle(state, army, occupant, destinationProvinceId);
  }

  const fromProvinceId = army.provinceId;
  army.provinceId = destinationProvinceId;
  return [
    {
      type: "army.moved",
      sequence: nextSequence(state),
      turn: state.turn,
      armyId: army.id,
      fromProvinceId,
      toProvinceId: army.provinceId,
      movementPointsRemaining: army.movementPoints,
    },
    ...captureIfForeign(state, army, destinationProvinceId),
  ];
}

function applyQueueMove(
  state: WorldState,
  envelope: CommandEnvelope<MoveArmyCommand>,
): WorldEvent[] {
  const events: WorldEvent[] = [];
  const existingIndex = state.orderQueue.findIndex(
    (order) => order.command.armyId === envelope.command.armyId,
  );
  if (existingIndex >= 0) {
    const previous = state.orderQueue[existingIndex];
    if (previous) {
      state.orderQueue.splice(existingIndex, 1);
      events.push({
        type: "order.cancelled",
        sequence: nextSequence(state),
        turn: state.turn,
        armyId: previous.command.armyId,
        destinationProvinceId: previous.command.destinationProvinceId,
      });
    }
  }
  state.orderQueue.push({
    id: envelope.id,
    actorFactionId: envelope.actorFactionId,
    command: envelope.command,
  });
  events.push({
    type: "order.queued",
    sequence: nextSequence(state),
    turn: state.turn,
    armyId: envelope.command.armyId,
    destinationProvinceId: envelope.command.destinationProvinceId,
  });
  return events;
}

function validateCancelOrder(
  state: WorldState,
  envelope: CommandEnvelope<CancelOrderCommand>,
): CommandFailure | undefined {
  const army = state.armies[envelope.command.armyId];
  if (!army) {
    return {
      code: "unknown-army",
      message: `Army ${envelope.command.armyId} does not exist.`,
    };
  }
  if (army.ownerId !== envelope.actorFactionId) {
    return {
      code: "not-owner",
      message: `Faction ${envelope.actorFactionId} does not control army ${army.id}.`,
    };
  }
  if (!queuedOrderForArmy(state, army.id)) {
    return {
      code: "no-queued-order",
      message: `Army ${army.id} has no queued order.`,
    };
  }
  return undefined;
}

function applyCancelOrder(
  state: WorldState,
  envelope: CommandEnvelope<CancelOrderCommand>,
): WorldEvent[] {
  const index = state.orderQueue.findIndex(
    (order) => order.command.armyId === envelope.command.armyId,
  );
  const previous = index >= 0 ? state.orderQueue[index] : undefined;
  if (!previous) {
    throw new Error("Cancel command was applied without a queued order.");
  }
  state.orderQueue.splice(index, 1);
  return [
    {
      type: "order.cancelled",
      sequence: nextSequence(state),
      turn: state.turn,
      armyId: previous.command.armyId,
      destinationProvinceId: previous.command.destinationProvinceId,
    },
  ];
}

function commitQueuedOrders(state: WorldState): WorldEvent[] {
  const events: WorldEvent[] = [];
  const queued = state.orderQueue;
  state.orderQueue = [];
  for (const order of queued) {
    const envelope: CommandEnvelope<MoveArmyCommand> = {
      id: order.id,
      actorFactionId: order.actorFactionId,
      expectedRevision: state.revision,
      command: order.command,
    };
    const commandFailure = validateMoveArmy(state, envelope);
    if (commandFailure) {
      events.push({
        type: "order.failed",
        sequence: nextSequence(state),
        turn: state.turn,
        armyId: order.command.armyId,
        destinationProvinceId: order.command.destinationProvinceId,
        reason: commandFailure.code,
      });
      continue;
    }
    const army = state.armies[order.command.armyId];
    if (!army) {
      continue;
    }
    events.push(...applyArmyMarch(state, army, order.command.destinationProvinceId));
  }
  return events;
}

function applyAiTurns(state: WorldState): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (const factionId of Object.keys(state.factions).sort()) {
    const choice = chooseAiArmyMove(state, factionId);
    if (!choice) {
      continue;
    }
    const army = state.armies[choice.armyId];
    if (!army) {
      continue;
    }
    events.push(...applyArmyMarch(state, army, choice.destinationProvinceId));
  }
  return events;
}

function applyEndTurn(state: WorldState, _command: EndTurnCommand): WorldEvent[] {
  state.phase = "resolution";
  const events: WorldEvent[] = commitQueuedOrders(state);
  events.push(...applyAiTurns(state));
  const previousTurn = state.turn;
  const rng = new Rng32(state.rngStreams.strategicEvents);
  events.push(...progressSettlementQueues(state, previousTurn));
  events.push(...progressResearchQueues(state, previousTurn));

  const emitHarvestEvents = Object.keys(state.provinces).length <= HARVEST_EVENT_PROVINCE_LIMIT;
  for (const provinceId of Object.keys(state.provinces).sort()) {
    const province = state.provinces[provinceId];
    if (!province) {
      throw new Error(`Missing province ${provinceId} during turn resolution.`);
    }
    const storehouseBonus = foodBonusForProvince(state, province.id);
    if (
      (province.ownerId === UNORGANIZED_FACTION_ID ||
        province.homeOwnerId.startsWith(CULTURAL_HOME_PREFIX)) &&
      storehouseBonus === 0
    ) {
      continue;
    }
    const foodDelta = 5 + rng.intInclusive(-1, 1) + storehouseBonus;
    province.food += foodDelta;
    if (emitHarvestEvents) {
      events.push({
        type: "province.harvested",
        sequence: nextSequence(state),
        turn: previousTurn,
        provinceId,
        foodDelta,
      });
    }
  }

  for (const provinceId of Object.keys(state.provinces).sort()) {
    const province = state.provinces[provinceId];
    if (!province) {
      continue;
    }
    const unrestDelta = unrestDeltaForProvince(state, province.id);
    if (unrestDelta !== 0) {
      province.unrest = Math.max(0, province.unrest + unrestDelta);
    }
  }

  for (const factionId of Object.keys(state.factions).sort()) {
    const faction = state.factions[factionId];
    if (!faction) {
      throw new Error(`Missing faction ${factionId} during turn resolution.`);
    }
    if (faction.id === UNORGANIZED_FACTION_ID || faction.id.startsWith(CULTURAL_HOME_PREFIX)) {
      continue;
    }
    faction.treasury += 10 + buildingTreasuryDelta(state, faction.id);
    let armyCount = 0;
    for (const armyId of Object.keys(state.armies).sort()) {
      if (state.armies[armyId]?.ownerId === faction.id) {
        armyCount += 1;
      }
    }
    const treasuryDelta = -(armyCount * ARMY_UPKEEP_PER_ARMY);
    faction.treasury = Math.max(0, faction.treasury + treasuryDelta);
    if (armyCount > 0) {
      events.push({
        type: "faction.upkeep",
        sequence: nextSequence(state),
        turn: previousTurn,
        factionId: faction.id,
        treasuryDelta,
        armyCount,
      });
    }
  }

  for (const armyId of Object.keys(state.armies).sort()) {
    const army = state.armies[armyId];
    if (!army) {
      throw new Error(`Missing army ${armyId} during turn resolution.`);
    }
    army.movementPoints = army.maxMovementPoints;
  }

  state.rngStreams.strategicEvents = rng.getState();
  state.turn += 1;
  state.phase = "planning";
  events.push({
    type: "turn.advanced",
    sequence: nextSequence(state),
    turn: state.turn,
    previousTurn,
  });

  return events;
}

export function executeCommand(state: WorldState, envelope: CommandEnvelope): CommandResult {
  const envelopeFailure = validateEnvelope(state, envelope);
  if (envelopeFailure) {
    return failure(envelopeFailure.code, envelopeFailure.message);
  }

  let commandFailure: CommandFailure | undefined;
  switch (envelope.command.type) {
    case "army.move":
      commandFailure = validateMoveArmy(state, envelope as CommandEnvelope<MoveArmyCommand>);
      break;
    case "army.recruit":
      commandFailure = validateRecruitArmy(state, envelope as CommandEnvelope<RecruitArmyCommand>);
      break;
    case "settlement.queue-building":
      commandFailure = validateQueueBuilding(
        state,
        envelope as CommandEnvelope<QueueBuildingCommand>,
      );
      break;
    case "order.cancel":
      commandFailure = validateCancelOrder(state, envelope as CommandEnvelope<CancelOrderCommand>);
      break;
    case "research.select":
      commandFailure = validateSelectResearch(
        state,
        envelope as CommandEnvelope<SelectResearchCommand>,
      );
      break;
    case "strategic.end-turn":
      break;
    default: {
      const exhaustive: never = envelope.command;
      throw new Error(`Unhandled command: ${JSON.stringify(exhaustive)}`);
    }
  }

  if (commandFailure) {
    return failure(commandFailure.code, commandFailure.message);
  }

  let events: WorldEvent[];
  switch (envelope.command.type) {
    case "army.move":
      events = applyQueueMove(state, envelope as CommandEnvelope<MoveArmyCommand>);
      break;
    case "army.recruit":
      events = applyRecruitArmy(state, envelope as CommandEnvelope<RecruitArmyCommand>);
      break;
    case "settlement.queue-building":
      events = applyQueueBuilding(state, envelope as CommandEnvelope<QueueBuildingCommand>);
      break;
    case "order.cancel":
      events = applyCancelOrder(state, envelope as CommandEnvelope<CancelOrderCommand>);
      break;
    case "research.select":
      events = applySelectResearch(state, envelope as CommandEnvelope<SelectResearchCommand>);
      break;
    case "strategic.end-turn":
      events = applyEndTurn(state, envelope.command);
      break;
    default: {
      const exhaustive: never = envelope.command;
      throw new Error(`Unhandled command: ${JSON.stringify(exhaustive)}`);
    }
  }

  state.acceptedCommandIds.push(envelope.id);
  state.revision += 1;
  assertWorldInvariants(state);

  return {
    ok: true,
    state,
    events,
    stateHash: hashWorld(state),
  };
}
