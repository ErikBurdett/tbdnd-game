import { assertWorldInvariants } from "./invariants";
import { startingCompletedResearch, WORLD_SCHEMA_VERSION, type WorldState } from "./model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeWorld(state: WorldState): string {
  assertWorldInvariants(state);
  return JSON.stringify(state);
}

export function deserializeWorld(serialized: string): WorldState {
  const parsed: unknown = JSON.parse(serialized);
  if (!isRecord(parsed)) {
    throw new TypeError("World snapshot must be an object.");
  }
  if (parsed.schemaVersion !== WORLD_SCHEMA_VERSION) {
    throw new TypeError(
      `Unsupported world schema version: ${String(parsed.schemaVersion)}. Expected ${WORLD_SCHEMA_VERSION}.`,
    );
  }

  const state = parsed as unknown as WorldState;
  for (const province of Object.values(state.provinces)) {
    if (typeof province.homeOwnerId !== "string") {
      province.homeOwnerId = province.ownerId;
    }
  }
  if (!isRecord(parsed.settlements)) {
    state.settlements = {};
  }
  if (!Array.isArray(parsed.orderQueue)) {
    state.orderQueue = [];
  }
  for (const faction of Object.values(state.factions)) {
    if (!Array.isArray(faction.completedResearchIds)) {
      faction.completedResearchIds = startingCompletedResearch(faction.id);
    }
  }
  assertWorldInvariants(state);
  return state;
}
