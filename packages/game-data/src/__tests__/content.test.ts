import { describe, expect, it } from "vitest";
import buildings from "../../../../content/core/buildings.json";
import content from "../../../../content/core/content.json";
import factions from "../../../../content/core/factions.json";
import provinces from "../../../../content/core/provinces.json";
import research from "../../../../content/core/research.json";
import sources from "../../../../content/core/sources.json";
import units from "../../../../content/core/units.json";
import { ContentBundleSchema } from "../bundle";
import { validateContentReferences } from "../validate";

const rawBundle = {
  ...content,
  sources,
  factions,
  provinces,
  units,
  buildings,
  research,
};

describe("core content", () => {
  it("matches schemas and has valid cross references", () => {
    const parsed = ContentBundleSchema.parse(rawBundle);
    expect(validateContentReferences(parsed)).toEqual([]);
  });

  it("contains an explicit classification on every authored game record", () => {
    const records = [...factions, ...provinces, ...units, ...buildings, ...research];
    expect(records.every((record) => typeof record.classification === "string")).toBe(true);
  });
});
