import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { cloneWorld, createSampleWorld, hashWorld } from "../world";

describe("field battle on contested march", () => {
  it("lets the stronger attacker destroy the garrison and take the province", () => {
    const state = createSampleWorld(10);
    const queued = executeCommand(state, {
      id: "command.attack.river",
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
      id: "command.commit.attack",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "battle.resolved",
        "army.destroyed",
        "army.moved",
        "province.captured",
      ]),
    );
    expect(state.armies["army.orontes-watch"]).toBeUndefined();
    expect(state.armies["army.first-frontier"]?.provinceId).toBe("province.river-crossing");
    expect(state.armies["army.first-frontier"]?.strength).toBe(1_120);
    expect(state.provinces["province.river-crossing"]?.ownerId).toBe("faction.aurelia");
  });

  it("holds the province when the defender is at least as strong", () => {
    const state = createSampleWorld(10);
    const attacker = state.armies["army.first-frontier"];
    if (!attacker) {
      throw new Error("Missing player army.");
    }
    attacker.strength = 800;
    const before = cloneWorld(state);
    const beforeHash = hashWorld(state);

    const queued = executeCommand(state, {
      id: "command.attack.river",
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
      id: "command.commit.defense",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(state.armies["army.first-frontier"]).toBeUndefined();
    expect(state.armies["army.orontes-watch"]?.provinceId).toBe("province.river-crossing");
    expect(state.armies["army.orontes-watch"]?.strength).toBe(720);
    expect(state.provinces["province.river-crossing"]?.ownerId).toBe("faction.orontes");
    expect(hashWorld(before)).toBe(beforeHash);
  });

  it("rejects stacking on a friendly army without mutating state", () => {
    const state = createSampleWorld(10);
    const extra = state.armies["army.orontes-watch"];
    if (!extra) {
      throw new Error("Missing Orontes army.");
    }
    extra.ownerId = "faction.aurelia";
    extra.provinceId = "province.river-crossing";
    const before = cloneWorld(state);
    const beforeHash = hashWorld(state);

    const result = executeCommand(state, {
      id: "command.stack",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "occupied-by-ally",
        message: "province.river-crossing already holds army.orontes-watch.",
      },
    });
    expect(state).toEqual(before);
    expect(hashWorld(state)).toBe(beforeHash);
  });
});
