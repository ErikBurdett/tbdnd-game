import { describe, expect, it } from "vitest";
import { chooseAiArmyMove } from "../ai";
import { executeCommand } from "../commands";
import { createSampleWorld } from "../world";

function endTurn(state: ReturnType<typeof createSampleWorld>, revision: number, id: string) {
  return executeCommand(state, {
    id,
    actorFactionId: "faction.aurelia",
    expectedRevision: revision,
    command: { type: "strategic.end-turn" },
  });
}

describe("AI legal move during end turn", () => {
  it("holds when every attack is against a stronger player army", () => {
    const state = createSampleWorld(10);
    expect(chooseAiArmyMove(state, "faction.orontes")).toBeUndefined();
    expect(chooseAiArmyMove(state, "faction.arsacia")).toBeUndefined();

    const result = endTurn(state, 0, "command.end-turn.hold");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.events.some((event) => event.type === "army.moved")).toBe(false);
    expect(state.armies["army.orontes-watch"]?.provinceId).toBe("province.river-crossing");
    expect(state.armies["army.arsacia-host"]?.provinceId).toBe("province.eastern-march");
  });

  it("reclaims empty player land instead of attacking a stronger stack", () => {
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

    const firstEnd = endTurn(state, 1, "command.end-turn.1");
    expect(firstEnd.ok).toBe(true);

    const returnHome = executeCommand(state, {
      id: "command.return.west",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.western-gate",
      },
    });
    expect(returnHome.ok).toBe(true);

    expect(chooseAiArmyMove(state, "faction.arsacia")).toBeUndefined();

    const secondEnd = endTurn(state, 3, "command.end-turn.2");
    expect(secondEnd.ok).toBe(true);
    if (!secondEnd.ok) {
      return;
    }
    expect(secondEnd.events.map((event) => event.type)).toContain("army.moved");
    expect(state.armies["army.arsacia-host"]?.provinceId).toBe("province.river-crossing");
    expect(state.provinces["province.river-crossing"]?.ownerId).toBe("faction.arsacia");
    expect(state.provinces["province.western-gate"]?.ownerId).toBe("faction.aurelia");
  });
});
