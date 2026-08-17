import { describe, expect, it } from "vitest";
import type { CommandEnvelope } from "../model";
import { runReplay } from "../replay";
import { deserializeWorld, serializeWorld } from "../serialization";
import { createSampleWorld, hashWorld } from "../world";

function tenEndTurns(): CommandEnvelope[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `command.end-turn.${index + 1}`,
    actorFactionId: "faction.aurelia",
    expectedRevision: index,
    command: { type: "strategic.end-turn" as const },
  }));
}

describe("ten-turn player and AI loop", () => {
  it("produces the same hash for two same-seed ten-turn runs", () => {
    const commands = tenEndTurns();
    const first = runReplay(createSampleWorld(42), commands);
    const second = runReplay(createSampleWorld(42), commands);

    expect(first.checkpoints).toEqual(second.checkpoints);
    expect(first.finalHash).toBe(second.finalHash);
    expect(first.finalState.turn).toBe(11);
    expect(first.finalState.armies["army.orontes-watch"]?.provinceId).toBe(
      "province.river-crossing",
    );
    expect(first.finalState.armies["army.arsacia-host"]?.provinceId).toBe("province.eastern-march");
  });

  it("continues equivalently after a mid-campaign serialize", () => {
    const commands = tenEndTurns();
    const early = commands.slice(0, 4);
    const late = commands.slice(4);
    const continuous = runReplay(createSampleWorld(91), commands);
    const split = runReplay(createSampleWorld(91), early);
    const loaded = deserializeWorld(serializeWorld(split.finalState));
    const resumed = runReplay(loaded, late);

    expect(hashWorld(resumed.finalState)).toBe(continuous.finalHash);
    expect(resumed.finalState).toEqual(continuous.finalState);
  });
});
