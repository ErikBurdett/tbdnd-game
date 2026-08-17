import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { listLegalArmyDestinations } from "../queries";
import { buildWorldReadModel, createSampleWorld } from "../world";

describe("listLegalArmyDestinations", () => {
  it("lists adjacent provinces while the army has movement", () => {
    const state = createSampleWorld(10);
    expect(listLegalArmyDestinations(state, "army.first-frontier")).toEqual([
      "province.river-crossing",
    ]);
  });

  it("exposes destinations on the campaign read model", () => {
    const army = buildWorldReadModel(createSampleWorld(10)).armies.find(
      (candidate) => candidate.id === "army.first-frontier",
    );
    expect(army?.legalDestinationIds).toEqual(["province.river-crossing"]);
    expect(army?.movePreviews).toEqual([
      {
        provinceId: "province.river-crossing",
        kind: "field-battle",
        occupantArmyId: "army.orontes-watch",
        willCapture: true,
      },
    ]);
  });

  it("keeps destinations after a march is queued so the order can be replaced", () => {
    const state = createSampleWorld(10);
    const result = executeCommand(state, {
      id: "command.move.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(result.ok).toBe(true);
    expect(listLegalArmyDestinations(state, "army.first-frontier")).toEqual([
      "province.river-crossing",
    ]);
    expect(state.orderQueue[0]?.command.destinationProvinceId).toBe("province.river-crossing");
  });
});
