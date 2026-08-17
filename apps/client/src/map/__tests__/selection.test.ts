import { describe, expect, it } from "vitest";
import { type MapArmyPreview, type MapSelection, resolveMapPick } from "../selection";

const PLAYER = "faction.aurelia";
const army: MapArmyPreview = {
  id: "army.first-frontier",
  ownerId: PLAYER,
  legalDestinationIds: ["province.river-crossing"],
};

const none: MapSelection = { kind: "none" };
const selectedArmy: MapSelection = { kind: "army", id: army.id };

describe("resolveMapPick", () => {
  it("selects an army on left-click", () => {
    expect(resolveMapPick(none, { kind: "army", id: army.id, button: 0 }, PLAYER, [army])).toEqual({
      selection: selectedArmy,
    });
  });

  it("selects a province when no army is selected", () => {
    expect(
      resolveMapPick(none, { kind: "province", id: "province.western-gate", button: 0 }, PLAYER, [
        army,
      ]),
    ).toEqual({
      selection: { kind: "province", id: "province.western-gate" },
    });
  });

  it("issues a move when a highlighted destination is left-clicked", () => {
    expect(
      resolveMapPick(
        selectedArmy,
        { kind: "province", id: "province.river-crossing", button: 0 },
        PLAYER,
        [army],
      ),
    ).toEqual({
      selection: selectedArmy,
      command: {
        type: "army.move",
        armyId: army.id,
        destinationProvinceId: "province.river-crossing",
      },
    });
  });

  it("inspects an illegal destination on left-click instead of moving", () => {
    expect(
      resolveMapPick(
        selectedArmy,
        { kind: "province", id: "province.eastern-march", button: 0 },
        PLAYER,
        [army],
      ),
    ).toEqual({
      selection: { kind: "province", id: "province.eastern-march" },
    });
  });

  it("right-clicks issue a move so the simulation can reject it", () => {
    expect(
      resolveMapPick(
        selectedArmy,
        { kind: "province", id: "province.eastern-march", button: 2 },
        PLAYER,
        [army],
      ),
    ).toEqual({
      selection: selectedArmy,
      command: {
        type: "army.move",
        armyId: army.id,
        destinationProvinceId: "province.eastern-march",
      },
    });
  });

  it("clears selection on background click", () => {
    expect(resolveMapPick(selectedArmy, { kind: "background" }, PLAYER, [army])).toEqual({
      selection: { kind: "none" },
    });
  });
});
