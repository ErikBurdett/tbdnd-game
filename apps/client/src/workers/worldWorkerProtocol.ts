import type {
  CommandEnvelope,
  CommandFailure,
  WorldEvent,
  WorldReadModel,
} from "@ancient/sim-core";

export type WorldWorkerRequest =
  | {
      type: "world.initialize";
      seed: number;
      serializedWorld?: string;
      viewerFactionId?: string;
      playerFactionId?: string;
    }
  | {
      type: "world.command";
      envelope: CommandEnvelope;
    };

export type WorldWorkerResponse =
  | {
      type: "world.snapshot";
      readModel: WorldReadModel;
      events: WorldEvent[];
      serializedWorld: string;
    }
  | {
      type: "world.rejected";
      error: CommandFailure;
    }
  | {
      type: "world.crashed";
      message: string;
    };
