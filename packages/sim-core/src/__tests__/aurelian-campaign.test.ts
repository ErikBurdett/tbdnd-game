import { describe, expect, it } from "vitest";
import {
  AURELIAN_CAMPAIGN_SEED,
  AURELIAN_FACTION_ID,
  simulateAurelianCampaign,
} from "../campaigns/aurelian";
import { ROME_FACTION_ID } from "../maps/earthWorld";
import { serializeWorld } from "../serialization";

describe("Aurelian Consular War campaign", () => {
  it("expands Rome across the 84 BCE earth map and hashes stably", () => {
    const first = simulateAurelianCampaign();
    const second = simulateAurelianCampaign();

    expect(AURELIAN_FACTION_ID).toBe(ROME_FACTION_ID);
    expect(first.finalHash).toBe(second.finalHash);
    expect(first.state.seed).toBe(AURELIAN_CAMPAIGN_SEED);
    expect(first.state.turn).toBeGreaterThan(15);
    expect(Object.keys(first.state.provinces).length).toBeGreaterThan(2000);
    const owned = Object.values(first.state.provinces).filter(
      (province) => province.ownerId === ROME_FACTION_ID,
    );
    expect(owned.length).toBeGreaterThan(16);
    expect(first.state.provinces["province.latium"]?.ownerId).toBe(ROME_FACTION_ID);
    expect(first.state.armies["army.rome.field"]).toBeDefined();
    expect(Object.values(first.state.armies).some((army) => army.id.startsWith("army.levy."))).toBe(
      true,
    );
    expect(first.events.some((event) => event.type === "province.captured")).toBe(true);
    expect(serializeWorld(first.state)).toBe(serializeWorld(second.state));
  });
});
