import type { WorldState } from "./model";

export function assertWorldInvariants(state: WorldState): void {
  if (!Number.isSafeInteger(state.turn) || state.turn < 1) {
    throw new Error(`Turn must be a positive safe integer; received ${state.turn}.`);
  }

  if (!Number.isSafeInteger(state.revision) || state.revision < 0) {
    throw new Error(`Revision must be a non-negative safe integer; received ${state.revision}.`);
  }

  const commandIds = new Set(state.acceptedCommandIds);
  if (commandIds.size !== state.acceptedCommandIds.length) {
    throw new Error("Accepted command IDs must be unique.");
  }

  for (const provinceId of Object.keys(state.provinces).sort()) {
    const province = state.provinces[provinceId];
    if (!province) {
      throw new Error(`Province index is missing ${provinceId}.`);
    }
    if (!state.factions[province.ownerId]) {
      throw new Error(`Province ${province.id} references unknown owner ${province.ownerId}.`);
    }
    if (!state.factions[province.homeOwnerId]) {
      throw new Error(
        `Province ${province.id} references unknown home owner ${province.homeOwnerId}.`,
      );
    }
    if (province.food < 0 || province.unrest < 0) {
      throw new Error(`Province ${province.id} contains a negative aggregate.`);
    }
    for (const neighborId of [...province.neighborIds].sort()) {
      const neighbor = state.provinces[neighborId];
      if (!neighbor) {
        throw new Error(`Province ${province.id} references unknown neighbor ${neighborId}.`);
      }
      if (!neighbor.neighborIds.includes(province.id)) {
        throw new Error(`Province edge ${province.id} ↔ ${neighborId} is not reciprocal.`);
      }
    }
  }

  const occupied = new Map<string, string>();
  for (const armyId of Object.keys(state.armies).sort()) {
    const army = state.armies[armyId];
    if (!army) {
      throw new Error(`Army index is missing ${armyId}.`);
    }
    if (!state.factions[army.ownerId]) {
      throw new Error(`Army ${army.id} references unknown owner ${army.ownerId}.`);
    }
    if (!state.provinces[army.provinceId]) {
      throw new Error(`Army ${army.id} references unknown province ${army.provinceId}.`);
    }
    if (army.strength < 1) {
      throw new Error(`Army ${army.id} has non-positive strength.`);
    }
    if (
      army.movementPoints < 0 ||
      army.movementPoints > army.maxMovementPoints ||
      army.maxMovementPoints < 0
    ) {
      throw new Error(`Army ${army.id} has invalid movement points.`);
    }
    const existing = occupied.get(army.provinceId);
    if (existing) {
      throw new Error(`Province ${army.provinceId} holds both ${existing} and ${army.id}.`);
    }
    occupied.set(army.provinceId, army.id);
  }

  const settled = new Map<string, string>();
  for (const settlementId of Object.keys(state.settlements).sort()) {
    const settlement = state.settlements[settlementId];
    if (!settlement) {
      throw new Error(`Settlement index is missing ${settlementId}.`);
    }
    if (!state.factions[settlement.ownerId]) {
      throw new Error(
        `Settlement ${settlement.id} references unknown owner ${settlement.ownerId}.`,
      );
    }
    if (!state.provinces[settlement.provinceId]) {
      throw new Error(
        `Settlement ${settlement.id} references unknown province ${settlement.provinceId}.`,
      );
    }
    const existing = settled.get(settlement.provinceId);
    if (existing) {
      throw new Error(
        `Province ${settlement.provinceId} holds both ${existing} and ${settlement.id}.`,
      );
    }
    settled.set(settlement.provinceId, settlement.id);
  }

  const queuedArmies = new Set<string>();
  for (const order of state.orderQueue) {
    if (!state.armies[order.command.armyId]) {
      throw new Error(`Order queue references unknown army ${order.command.armyId}.`);
    }
    if (!state.provinces[order.command.destinationProvinceId]) {
      throw new Error(
        `Order queue references unknown province ${order.command.destinationProvinceId}.`,
      );
    }
    if (!state.factions[order.actorFactionId]) {
      throw new Error(`Order queue references unknown actor ${order.actorFactionId}.`);
    }
    if (queuedArmies.has(order.command.armyId)) {
      throw new Error(`Army ${order.command.armyId} has more than one queued order.`);
    }
    queuedArmies.add(order.command.armyId);
  }
}
