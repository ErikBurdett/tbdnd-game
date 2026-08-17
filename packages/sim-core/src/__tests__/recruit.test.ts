import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { LEVY_RECRUIT_COST, LEVY_RECRUIT_STRENGTH } from "../model";
import { cloneWorld, createSampleWorld, hashWorld } from "../world";

describe("army.recruit", () => {
  it("raises a levy on empty owned land and spends treasury", () => {
    const state = createSampleWorld(10);
    const attack = executeCommand(state, {
      id: "command.attack.river",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(attack.ok).toBe(true);
    const committed = executeCommand(state, {
      id: "command.commit.attack",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(committed.ok).toBe(true);

    const treasuryBefore = state.factions["faction.aurelia"]?.treasury ?? 0;
    const result = executeCommand(state, {
      id: "command.recruit.west",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: { type: "army.recruit", provinceId: "province.western-gate" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const levy = Object.values(state.armies).find((army) => army.id.startsWith("army.levy."));
    expect(levy).toMatchObject({
      name: "Western Gate Levy",
      ownerId: "faction.aurelia",
      provinceId: "province.western-gate",
      strength: LEVY_RECRUIT_STRENGTH,
    });
    expect(state.factions["faction.aurelia"]?.treasury).toBe(treasuryBefore - LEVY_RECRUIT_COST);
    expect(result.events.map((event) => event.type)).toEqual(["army.recruited"]);
  });

  it("rejects recruiting on occupied land without mutating state", () => {
    const state = createSampleWorld(10);
    const before = cloneWorld(state);
    const beforeHash = hashWorld(state);
    const result = executeCommand(state, {
      id: "command.recruit.blocked",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: { type: "army.recruit", provinceId: "province.western-gate" },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("occupied-by-ally");
    expect(state).toEqual(before);
    expect(hashWorld(state)).toBe(beforeHash);
  });
});
