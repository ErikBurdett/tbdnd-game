import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { cloneWorld, createSampleWorld, hashWorld } from "../world";

describe("planning order queue", () => {
  it("queues a march during planning and resolves it on commit", () => {
    const state = createSampleWorld(10);
    const queued = executeCommand(state, {
      id: "command.move.river",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) {
      return;
    }
    expect(queued.events.map((event) => event.type)).toEqual(["order.queued"]);
    expect(state.armies["army.first-frontier"]?.provinceId).toBe("province.western-gate");
    expect(state.orderQueue).toHaveLength(1);
    expect(state.phase).toBe("planning");

    const committed = executeCommand(state, {
      id: "command.commit",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(committed.ok).toBe(true);
    if (!committed.ok) {
      return;
    }
    expect(committed.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "battle.resolved",
        "army.moved",
        "province.captured",
        "turn.advanced",
      ]),
    );
    expect(state.armies["army.first-frontier"]?.provinceId).toBe("province.river-crossing");
    expect(state.orderQueue).toEqual([]);
    expect(state.phase).toBe("planning");
  });

  it("replaces a queued march and can cancel it", () => {
    const state = createSampleWorld(10);
    const first = executeCommand(state, {
      id: "command.move.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(first.ok).toBe(true);

    const replaced = executeCommand(state, {
      id: "command.move.2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) {
      return;
    }
    expect(replaced.events.map((event) => event.type)).toEqual(["order.cancelled", "order.queued"]);
    expect(state.orderQueue).toHaveLength(1);

    const cancelled = executeCommand(state, {
      id: "command.cancel",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: { type: "order.cancel", armyId: "army.first-frontier" },
    });
    expect(cancelled.ok).toBe(true);
    expect(state.orderQueue).toEqual([]);
  });

  it("rejects cancelling when no order is queued", () => {
    const state = createSampleWorld(10);
    const before = cloneWorld(state);
    const beforeHash = hashWorld(state);
    const result = executeCommand(state, {
      id: "command.cancel.none",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: { type: "order.cancel", armyId: "army.first-frontier" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("no-queued-order");
    expect(state).toEqual(before);
    expect(hashWorld(state)).toBe(beforeHash);
  });
});
