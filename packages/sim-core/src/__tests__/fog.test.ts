import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { isProvinceVisible } from "../queries";
import { buildWorldReadModel, createSampleWorld } from "../world";

const PLAYER = "faction.aurelia";

describe("fog of war", () => {
  it("hides the far march and its host from the player at the start", () => {
    const state = createSampleWorld(10);
    expect(isProvinceVisible(state, "province.western-gate", PLAYER)).toBe(true);
    expect(isProvinceVisible(state, "province.river-crossing", PLAYER)).toBe(true);
    expect(isProvinceVisible(state, "province.eastern-march", PLAYER)).toBe(false);

    const readModel = buildWorldReadModel(state, PLAYER);
    expect(
      readModel.provinces.find((province) => province.id === "province.eastern-march"),
    ).toEqual(
      expect.objectContaining({
        visible: false,
        name: "Unscouted land",
        ownerId: "faction.arsacia",
      }),
    );
    expect(readModel.armies.map((army) => army.id)).toEqual([
      "army.first-frontier",
      "army.orontes-watch",
    ]);
    expect(readModel.factions.find((faction) => faction.id === "faction.arsacia")?.treasury).toBe(
      undefined,
    );
  });

  it("reveals the east after the river is taken", () => {
    const state = createSampleWorld(10);
    const queued = executeCommand(state, {
      id: "command.attack.river",
      actorFactionId: PLAYER,
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
      actorFactionId: PLAYER,
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(result.ok).toBe(true);

    const readModel = buildWorldReadModel(state, PLAYER);
    expect(isProvinceVisible(state, "province.eastern-march", PLAYER)).toBe(true);
    expect(readModel.armies.map((army) => army.id)).toContain("army.arsacia-host");
    expect(
      readModel.provinces.find((province) => province.id === "province.eastern-march")?.visible,
    ).toBe(true);
  });
});
