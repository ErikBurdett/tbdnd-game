import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { assertWorldInvariants } from "../invariants";
import { createSampleWorld } from "../world";

describe("100-turn soak", () => {
  it("preserves invariants across one hundred committed turns", () => {
    const state = createSampleWorld(7);
    for (let step = 0; step < 100; step += 1) {
      const result = executeCommand(state, {
        id: `command.end-turn.${step + 1}`,
        actorFactionId: "faction.aurelia",
        expectedRevision: step,
        command: { type: "strategic.end-turn" },
      });
      expect(result.ok, `turn ${step + 1} should commit`).toBe(true);
      assertWorldInvariants(state);
    }
    expect(state.turn).toBe(101);
    expect(state.phase).toBe("planning");
    expect(state.orderQueue).toEqual([]);
  });
});
