import { executeCommand } from "../commands";
import { createEarthWorld, ROME_FACTION_ID, UNORGANIZED_FACTION_ID } from "../maps/earthWorld";
import type { CommandEnvelope, WorldEvent, WorldState } from "../model";
import { armyInProvince, listLegalArmyDestinations, listRecruitableProvinces } from "../queries";
import { hashWorld } from "../world";

export const AURELIAN_PROFILE_ID = "profile.aurelian";
export const AURELIAN_PROFILE_NAME = "Aurelian";
export const AURELIAN_PROFILE_MOTTO = "Roma holds the crossing.";
export const AURELIAN_SAVE_ID = "save.aurelian-consular-84";
export const AURELIAN_CAMPAIGN_NAME = "Consular War";
export const AURELIAN_CAMPAIGN_SEED = 84;
export const AURELIAN_CREATED_AT = "2026-08-17T00:00:00.000Z";
export const AURELIAN_FACTION_ID = ROME_FACTION_ID;

export interface SimulatedCampaign {
  state: WorldState;
  events: WorldEvent[];
  finalHash: string;
  commands: CommandEnvelope[];
}

function pickRomanMarch(state: WorldState, armyId: string): string | undefined {
  const army = state.armies[armyId];
  if (!army) {
    return undefined;
  }
  let best: { id: string; score: number } | undefined;
  for (const destinationId of listLegalArmyDestinations(state, armyId)) {
    const occupant = armyInProvince(state, destinationId);
    const province = state.provinces[destinationId];
    if (!province) {
      continue;
    }
    if (occupant && occupant.strength >= army.strength) {
      continue;
    }
    let score = 10;
    if (province.ownerId === UNORGANIZED_FACTION_ID) {
      score = 40;
    } else if (occupant) {
      score = 25;
    } else if (province.ownerId !== army.ownerId) {
      score = 30;
    } else if (
      province.neighborIds.some((neighborId) => {
        const neighbor = state.provinces[neighborId];
        return neighbor !== undefined && neighbor.ownerId !== army.ownerId;
      })
    ) {
      score = 5;
    } else {
      continue;
    }
    if (!best || score > best.score || (score === best.score && destinationId < best.id)) {
      best = { id: destinationId, score };
    }
  }
  return best?.id;
}

function pickLevySite(state: WorldState): string | undefined {
  const sites = listRecruitableProvinces(state, ROME_FACTION_ID);
  if (sites.includes("province.latium")) {
    return "province.latium";
  }
  return (
    sites.find((provinceId) => {
      const province = state.provinces[provinceId];
      return province?.neighborIds.every(
        (neighborId) => state.provinces[neighborId]?.ownerId === ROME_FACTION_ID,
      );
    }) ?? sites[0]
  );
}

export function simulateAurelianCampaign(seed = AURELIAN_CAMPAIGN_SEED): SimulatedCampaign {
  const state = createEarthWorld(seed, ROME_FACTION_ID);
  const commands: CommandEnvelope[] = [];
  const events: WorldEvent[] = [];
  const armyId = "army.rome.field";

  for (let step = 0; step < 22; step += 1) {
    const destinationId = pickRomanMarch(state, armyId);
    if (destinationId) {
      const move: CommandEnvelope = {
        id: `aurelian.move.${step}`,
        actorFactionId: ROME_FACTION_ID,
        expectedRevision: state.revision,
        command: { type: "army.move", armyId, destinationProvinceId: destinationId },
      };
      const moved = executeCommand(state, move);
      if (!moved.ok) {
        throw new Error(`Roman march ${move.id} failed: ${moved.error.message}`);
      }
      commands.push(move);
      events.push(...moved.events);
    }

    const hasLevy = Object.keys(state.armies).some((id) => id.startsWith("army.levy."));
    if (!hasLevy) {
      const site = pickLevySite(state);
      if (site) {
        const recruit: CommandEnvelope = {
          id: `aurelian.recruit.${step}`,
          actorFactionId: ROME_FACTION_ID,
          expectedRevision: state.revision,
          command: { type: "army.recruit", provinceId: site },
        };
        const raised = executeCommand(state, recruit);
        if (!raised.ok) {
          throw new Error(`Roman levy failed: ${raised.error.message}`);
        }
        commands.push(recruit);
        events.push(...raised.events);
      }
    }

    const endTurn: CommandEnvelope = {
      id: `aurelian.end-turn.${step}`,
      actorFactionId: ROME_FACTION_ID,
      expectedRevision: state.revision,
      command: { type: "strategic.end-turn" },
    };
    const ended = executeCommand(state, endTurn);
    if (!ended.ok) {
      throw new Error(`Roman end turn failed: ${ended.error.message}`);
    }
    commands.push(endTurn);
    events.push(...ended.events);
  }

  return {
    state,
    events,
    finalHash: hashWorld(state),
    commands,
  };
}
