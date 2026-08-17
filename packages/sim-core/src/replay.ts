import { executeCommand } from "./commands";
import type { CommandEnvelope, WorldState } from "./model";
import { cloneWorld, hashWorld } from "./world";

export interface ReplayResult {
  finalState: WorldState;
  finalHash: string;
  checkpoints: string[];
}

export function runReplay(
  initialState: WorldState,
  commands: readonly CommandEnvelope[],
): ReplayResult {
  const state = cloneWorld(initialState);
  const checkpoints = [hashWorld(state)];

  for (const command of commands) {
    const result = executeCommand(state, command);
    if (!result.ok) {
      throw new Error(
        `Replay command ${command.id} was rejected: ${result.error.code} — ${result.error.message}`,
      );
    }
    checkpoints.push(result.stateHash);
  }

  return {
    finalState: state,
    finalHash: hashWorld(state),
    checkpoints,
  };
}
