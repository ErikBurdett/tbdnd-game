import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import { assertWorldInvariants } from "../invariants";
import { createEarthWorld, EARTH_MAP, ROME_FACTION_ID } from "../maps/earthWorld";
import { listLegalArmyDestinations } from "../queries";
import { buildWorldReadModel } from "../world";

describe("84 BCE earth map", () => {
  it("covers the world with reciprocal land and named Roman capital", () => {
    expect(EARTH_MAP.provinces.length).toBeGreaterThan(2000);
    expect(EARTH_MAP.cellDegrees).toBe(2);
    expect(
      EARTH_MAP.factions.some((faction) => faction.id === ROME_FACTION_ID && faction.playable),
    ).toBe(true);
    const ids = new Set(EARTH_MAP.provinces.map((province) => province.id));
    const byId = new Map(EARTH_MAP.provinces.map((province) => [province.id, province]));
    expect(ids.has("province.latium")).toBe(true);
    for (const province of EARTH_MAP.provinces) {
      for (const neighborId of province.neighborIds) {
        const neighbor = byId.get(neighborId);
        expect(neighbor?.neighborIds.includes(province.id)).toBe(true);
      }
    }
    const world = createEarthWorld(84, ROME_FACTION_ID);
    assertWorldInvariants(world);
    expect(world.provinces["province.latium"]?.ownerId).toBe(ROME_FACTION_ID);
    expect(world.armies["army.rome.field"]?.provinceId).toBe("province.latium");
    expect(world.settlements["settlement.latium"]?.ownerId).toBe(ROME_FACTION_ID);
    expect(world.factions[ROME_FACTION_ID]?.isAi).toBe(false);
    const playable = EARTH_MAP.factions.filter((faction) => faction.playable);
    expect(playable.length).toBeGreaterThanOrEqual(24);
    for (const faction of playable) {
      const held = EARTH_MAP.provinces.filter((province) => province.ownerId === faction.id);
      expect(held.length, `${faction.id} should hold land`).toBeGreaterThan(0);
      expect(world.armies[`army.${faction.id.replace("faction.", "")}.field`]).toBeDefined();
    }
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.meroe")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.arvernia")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.petra")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.aedui")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.crete")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.dacia")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.bithynia")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.madurai")).toBe(true);
    expect(EARTH_MAP.provinces.some((province) => province.id === "province.mirador")).toBe(true);
    expect(
      EARTH_MAP.factions.some(
        (faction) => faction.id === "faction.culture.maya" && faction.layer === "cultural",
      ),
    ).toBe(true);
    const readModel = buildWorldReadModel(world, ROME_FACTION_ID);
    expect(readModel.theaterSecured).toBe(false);
    const attestedHomeland = EARTH_MAP.provinces.filter(
      (province) =>
        province.ownerId !== "faction.unorganized" &&
        !province.ownerId.startsWith("faction.culture."),
    );
    expect(attestedHomeland.length).toBeGreaterThan(200);
    expect(attestedHomeland.length).toBeLessThan(EARTH_MAP.provinces.length * 0.4);
    const hanCapital = readModel.provinces.find((province) => province.id === "province.luoyang");
    expect(hanCapital?.ownerId).toBe("faction.han");
    expect(hanCapital?.visible).toBe(false);
    expect(hanCapital?.food).toBeUndefined();
  });

  it("does not let neighboring AI walk through Roman homeland", () => {
    const state = createEarthWorld(84, ROME_FACTION_ID);
    const startingRome = Object.values(state.provinces).filter(
      (province) => province.ownerId === ROME_FACTION_ID,
    ).length;
    const destinationId = listLegalArmyDestinations(state, "army.rome.field")[0];
    expect(destinationId).toBeDefined();
    const march = executeCommand(state, {
      id: "rome.leave-latium",
      actorFactionId: ROME_FACTION_ID,
      expectedRevision: 0,
      command: {
        type: "army.move",
        armyId: "army.rome.field",
        destinationProvinceId: destinationId ?? "",
      },
    });
    expect(march.ok).toBe(true);
    const ended = executeCommand(state, {
      id: "rome.end-turn",
      actorFactionId: ROME_FACTION_ID,
      expectedRevision: state.revision,
      command: { type: "strategic.end-turn" },
    });
    expect(ended.ok).toBe(true);
    if (!ended.ok) {
      return;
    }
    const owned = Object.values(state.provinces).filter(
      (province) => province.ownerId === ROME_FACTION_ID,
    );
    expect(owned.length).toBeGreaterThanOrEqual(startingRome);
    expect(state.provinces["province.latium"]?.ownerId).toBe(ROME_FACTION_ID);
    expect(ended.events.filter((event) => event.type === "province.harvested")).toHaveLength(0);
  });
});
