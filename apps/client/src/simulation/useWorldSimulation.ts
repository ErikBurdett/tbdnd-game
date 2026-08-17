import type { CommandEnvelope, WorldCommand, WorldEvent, WorldReadModel } from "@ancient/sim-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { type CampaignSession, sessionPlayerFactionId } from "../launcher/session";
import type { WorldWorkerRequest, WorldWorkerResponse } from "../workers/worldWorkerProtocol";

interface WorldSimulationController {
  readModel: WorldReadModel | undefined;
  lastEvents: WorldEvent[];
  serializedWorld: string | undefined;
  error: string | undefined;
  isReady: boolean;
  submit: (actorFactionId: string, command: WorldCommand) => void;
}

export function useWorldSimulation(
  session: CampaignSession | undefined,
): WorldSimulationController {
  const workerRef = useRef<Worker | null>(null);
  const commandSequenceRef = useRef(0);
  const revisionRef = useRef(0);
  const [readModel, setReadModel] = useState<WorldReadModel>();
  const [lastEvents, setLastEvents] = useState<WorldEvent[]>([]);
  const [serializedWorld, setSerializedWorld] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const worker = new Worker(new URL("../workers/world.worker.ts", import.meta.url), {
      type: "module",
      name: "world-simulation",
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorldWorkerResponse>): void => {
      switch (event.data.type) {
        case "world.snapshot":
          revisionRef.current = event.data.readModel.revision;
          setReadModel(event.data.readModel);
          setLastEvents(event.data.events);
          setSerializedWorld(event.data.serializedWorld);
          setError(undefined);
          break;
        case "world.rejected":
          setError(`${event.data.error.code}: ${event.data.error.message}`);
          break;
        case "world.crashed":
          setError(event.data.message);
          break;
        default: {
          const exhaustive: never = event.data;
          throw new Error(`Unhandled worker response: ${JSON.stringify(exhaustive)}`);
        }
      }
    };

    const playerFactionId = sessionPlayerFactionId(session);
    const initialize: WorldWorkerRequest =
      session.kind === "load"
        ? {
            type: "world.initialize",
            seed: session.seed,
            serializedWorld: session.serializedWorld,
            viewerFactionId: playerFactionId,
            playerFactionId,
          }
        : {
            type: "world.initialize",
            seed: session.seed,
            viewerFactionId: playerFactionId,
            playerFactionId,
          };
    worker.postMessage(initialize);
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [session]);

  const submit = useCallback((actorFactionId: string, command: WorldCommand): void => {
    const worker = workerRef.current;
    if (!worker) {
      setError("Simulation worker is not ready.");
      return;
    }
    commandSequenceRef.current += 1;
    const envelope: CommandEnvelope = {
      id: `browser-command-${commandSequenceRef.current}`,
      actorFactionId,
      expectedRevision: revisionRef.current,
      command,
    };
    const request: WorldWorkerRequest = { type: "world.command", envelope };
    worker.postMessage(request);
  }, []);

  return {
    readModel,
    lastEvents,
    serializedWorld,
    error,
    isReady: Boolean(readModel),
    submit,
  };
}
