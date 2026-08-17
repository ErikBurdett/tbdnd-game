/// <reference lib="webworker" />

import {
  buildWorldReadModel,
  createEarthWorld,
  deserializeWorld,
  executeCommand,
  isEarthPackCompatible,
  ROME_FACTION_ID,
  serializeWorld,
  type WorldEvent,
  type WorldState,
} from "@ancient/sim-core";
import type { WorldWorkerRequest, WorldWorkerResponse } from "./worldWorkerProtocol";

let world: WorldState | undefined;
let viewerFactionId = ROME_FACTION_ID;

function post(response: WorldWorkerResponse): void {
  self.postMessage(response);
}

function snapshot(events: WorldEvent[]): void {
  if (!world) {
    throw new Error("World worker has no campaign state.");
  }
  post({
    type: "world.snapshot",
    readModel: buildWorldReadModel(world, viewerFactionId),
    events,
    serializedWorld: serializeWorld(world),
  });
}

self.onmessage = (event: MessageEvent<WorldWorkerRequest>): void => {
  try {
    switch (event.data.type) {
      case "world.initialize": {
        const requestedFaction =
          event.data.playerFactionId ?? event.data.viewerFactionId ?? ROME_FACTION_ID;
        if (event.data.serializedWorld) {
          const loaded = deserializeWorld(event.data.serializedWorld);
          viewerFactionId =
            event.data.viewerFactionId ??
            Object.values(loaded.factions).find((faction) => !faction.isAi)?.id ??
            requestedFaction;
          world = isEarthPackCompatible(loaded)
            ? loaded
            : createEarthWorld(event.data.seed, viewerFactionId);
        } else {
          viewerFactionId = requestedFaction;
          world = createEarthWorld(event.data.seed, viewerFactionId);
        }
        snapshot([]);
        break;
      }
      case "world.command": {
        if (!world) {
          throw new Error("World worker received a command before initialization.");
        }
        const result = executeCommand(world, event.data.envelope);
        if (!result.ok) {
          post({ type: "world.rejected", error: result.error });
          return;
        }
        world = result.state;
        snapshot(result.events);
        break;
      }
      default: {
        const exhaustive: never = event.data;
        throw new Error(`Unhandled worker request: ${JSON.stringify(exhaustive)}`);
      }
    }
  } catch (error: unknown) {
    post({
      type: "world.crashed",
      message: error instanceof Error ? error.message : "Unknown world worker failure.",
    });
  }
};
