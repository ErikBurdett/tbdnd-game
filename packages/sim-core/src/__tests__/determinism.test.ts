import { describe, expect, it } from "vitest";
import {
  type CommandEnvelope,
  cloneWorld,
  createSampleWorld,
  deserializeWorld,
  executeCommand,
  hashWorld,
  runReplay,
  serializeWorld,
} from "../index";

function commands(): CommandEnvelope[] {
  return [
    {
      id: "command.move.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    },
    {
      id: "command.end-turn.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    },
  ];
}

describe("deterministic campaign simulation", () => {
  it("produces the same checkpoints from the same seed and commands", () => {
    const first = runReplay(createSampleWorld(42), commands());
    const second = runReplay(createSampleWorld(42), commands());

    expect(first.checkpoints).toEqual(second.checkpoints);
    expect(first.finalHash).toBe(second.finalHash);
    expect(first.finalState).toEqual(second.finalState);
  });

  it("does not mutate state or consume RNG when a command is rejected", () => {
    const state = createSampleWorld(42);
    const before = cloneWorld(state);
    const beforeHash = hashWorld(state);

    const result = executeCommand(state, {
      id: "command.invalid-move",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.eastern-march",
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "not-adjacent",
        message: "province.eastern-march is not adjacent to province.western-gate.",
      },
    });
    expect(state).toEqual(before);
    expect(hashWorld(state)).toBe(beforeHash);
  });

  it("continues equivalently after serialization", () => {
    const continuous = createSampleWorld(91);
    const split = createSampleWorld(91);
    const [move, endTurn] = commands();

    if (!move || !endTurn) {
      throw new Error("Test command fixture is incomplete.");
    }

    const firstContinuous = executeCommand(continuous, move);
    const firstSplit = executeCommand(split, move);
    expect(firstContinuous.ok).toBe(true);
    expect(firstSplit.ok).toBe(true);

    const loaded = deserializeWorld(serializeWorld(split));

    const continuousResult = executeCommand(continuous, endTurn);
    const loadedResult = executeCommand(loaded, endTurn);

    expect(continuousResult.ok).toBe(true);
    expect(loadedResult.ok).toBe(true);
    expect(hashWorld(continuous)).toBe(hashWorld(loaded));
    expect(continuous).toEqual(loaded);
  });
});
