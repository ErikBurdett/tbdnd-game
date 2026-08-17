import { describe, expect, it } from "vitest";
import {
  EARTH_NUMBERED_LABEL_MIN_ZOOM,
  earthLodForZoom,
  earthLodStep,
  earthShowsNumberedLabels,
  getEarthProvince,
  getEarthProvinceAtWorld,
  listEarthDrawBatches,
  pickEarthLabels,
} from "../maps/earthGeometry";
import {
  createEarthWorld,
  EARTH_CONTENT_VERSION,
  EARTH_MAP,
  isEarthPackCompatible,
  ROME_FACTION_ID,
} from "../maps/earthWorld";
import { buildWorldReadModel } from "../world";

describe("earth map LOD geometry", () => {
  it("resolves Latium from world coordinates and sharpens batches as zoom increases", () => {
    const latium = getEarthProvince("province.latium");
    expect(latium).toBeDefined();
    expect(EARTH_MAP.cellDegrees).toBe(2);
    expect(earthLodForZoom(0.3)).toBe("far");
    expect(earthLodForZoom(0.9)).toBe("mid");
    expect(earthLodForZoom(1.4)).toBe("mid");
    expect(earthLodForZoom(2.2)).toBe("near");
    expect(earthLodStep("far")).toBe(4);
    expect(earthLodStep("near")).toBe(1);
    expect(earthShowsNumberedLabels(1.4)).toBe(false);
    expect(earthShowsNumberedLabels(EARTH_NUMBERED_LABEL_MIN_ZOOM)).toBe(true);

    if (!latium) {
      return;
    }
    const hit = getEarthProvinceAtWorld(latium.labelX, latium.labelY);
    expect(hit?.id).toBe("province.latium");

    const world = createEarthWorld(84, ROME_FACTION_ID);
    const owners = Object.fromEntries(
      Object.values(world.provinces).map((province) => [province.id, province.ownerId]),
    );
    const aroundLatium = {
      x: latium.x - 80,
      y: latium.y - 80,
      right: latium.x + latium.w + 80,
      bottom: latium.y + latium.h + 80,
    };
    const far = listEarthDrawBatches(aroundLatium, 0.3, owners);
    const near = listEarthDrawBatches(aroundLatium, 2.2, owners);
    expect(far.some((batch) => batch.provinceIds.includes("province.latium"))).toBe(true);
    expect(near.some((batch) => batch.provinceIds.includes("province.latium"))).toBe(true);
    expect(
      near.find((batch) => batch.provinceIds.includes("province.latium"))?.provinceIds,
    ).toEqual(["province.latium"]);

    const readModel = buildWorldReadModel(world, ROME_FACTION_ID);
    expect(readModel.theaterSecured).toBe(false);
    expect(isEarthPackCompatible(world)).toBe(true);
    expect(
      isEarthPackCompatible({
        contentVersion: "earth.84bce.3",
        provinces: { "province.latium": {} },
      }),
    ).toBe(false);
    expect(world.contentVersion).toBe(EARTH_CONTENT_VERSION);
  });

  it("keeps regional labels spaced and hides numbered land until close zoom", () => {
    const latium = getEarthProvince("province.latium");
    if (!latium) {
      throw new Error("Latium is required for label tests.");
    }
    const world = createEarthWorld(84, ROME_FACTION_ID);
    const owners = Object.fromEntries(
      Object.values(world.provinces).map((province) => [province.id, province.ownerId]),
    );
    const europe = {
      x: latium.labelX - 400,
      y: latium.labelY - 280,
      right: latium.labelX + 400,
      bottom: latium.labelY + 280,
    };
    const mid = pickEarthLabels(europe, 0.92, {
      legalIds: [],
      armyProvinceIds: [],
      owners,
    });
    expect(mid.some((label) => label.id === "province.latium")).toBe(true);
    expect(mid.some((label) => label.name.startsWith("Territory "))).toBe(false);
    expect(labelsOverlap(mid, 70 / 0.92)).toBe(false);

    const close = pickEarthLabels(
      {
        x: latium.labelX - 80,
        y: latium.labelY - 80,
        right: latium.labelX + 80,
        bottom: latium.labelY + 80,
      },
      2.4,
      { legalIds: [], armyProvinceIds: [], owners },
    );
    expect(close.some((label) => label.id === "province.latium")).toBe(true);
  });
});

function labelsOverlap(labels: Array<{ x: number; y: number }>, minSeparation: number): boolean {
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      const left = labels[i];
      const right = labels[j];
      if (!left || !right) {
        continue;
      }
      if (Math.hypot(left.x - right.x, left.y - right.y) < minSeparation * 0.85) {
        return true;
      }
    }
  }
  return false;
}
