import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { createSampleWorld } from "../world";

describe("empty-province occupation", () => {
  it("captures a vacated foreign province without a battle", () => {
    const state = createSampleWorld(10);
    const watch = state.armies["army.orontes-watch"];
    if (!watch) {
      throw new Error("Missing Orontes army.");
    }
    watch.provinceId = "province.eastern-march";
    delete state.armies["army.arsacia-host"];

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

    const result = executeCommand(state, {
      id: "command.commit.river",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(state.provinces["province.river-crossing"]?.ownerId).toBe("faction.aurelia");
    expect(result.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["army.moved", "province.captured"]),
    );
    expect(result.events.find((event) => event.type === "province.captured")).toMatchObject({
      type: "province.captured",
      provinceId: "province.river-crossing",
      previousOwnerId: "faction.orontes",
      ownerId: "faction.aurelia",
    });
  });

  it("does not emit capture when marching inside owned land", () => {
    const state = createSampleWorld(10);
    const first = executeCommand(state, {
      id: "command.move.river",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(first.ok).toBe(true);

    const endTurn = executeCommand(state, {
      id: "command.end-turn.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(endTurn.ok).toBe(true);

    const returnHome = executeCommand(state, {
      id: "command.move.home",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.western-gate",
      },
    });

    expect(returnHome.ok).toBe(true);

    const committed = executeCommand(state, {
      id: "command.end-turn.2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 3,
      command: { type: "strategic.end-turn" },
    });
    expect(committed.ok).toBe(true);
    if (!committed.ok) {
      return;
    }
    expect(
      committed.events.some(
        (event) =>
          event.type === "province.captured" && event.provinceId === "province.western-gate",
      ),
    ).toBe(false);
    expect(state.armies["army.first-frontier"]?.provinceId).toBe("province.western-gate");
    expect(state.provinces["province.western-gate"]?.ownerId).toBe("faction.aurelia");
  });
});
