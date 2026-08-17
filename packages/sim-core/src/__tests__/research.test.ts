import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import {
  COMPOSITE_BOW_DOCTRINE_ID,
  COMPOSITE_BOW_LEVY_BONUS,
  LEVY_RECRUIT_STRENGTH,
  ORGANIZED_LOGISTICS_ID,
  RITUAL_ASTRONOMY_ID,
} from "../model";
import { createSampleWorld } from "../world";

describe("faction research", () => {
  it("starts with organized logistics and trains stronger levies after bow doctrine", () => {
    const state = createSampleWorld(10);
    expect(state.factions["faction.aurelia"]?.completedResearchIds).toEqual([
      ORGANIZED_LOGISTICS_ID,
    ]);
    const treasuryBefore = state.factions["faction.aurelia"]?.treasury ?? 0;
    const queued = executeCommand(state, {
      id: "command.research.bow",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: { type: "research.select", researchId: COMPOSITE_BOW_DOCTRINE_ID },
    });
    expect(queued.ok).toBe(true);
    expect(state.factions["faction.aurelia"]?.treasury).toBe(treasuryBefore - 100);
    expect(state.factions["faction.aurelia"]?.researchQueue).toEqual({
      researchId: COMPOSITE_BOW_DOCTRINE_ID,
      remainingTurns: 3,
    });

    for (let step = 1; step <= 3; step += 1) {
      const ended = executeCommand(state, {
        id: `command.research.end.${step}`,
        actorFactionId: "faction.aurelia",
        expectedRevision: step,
        command: { type: "strategic.end-turn" },
      });
      expect(ended.ok).toBe(true);
    }
    expect(state.factions["faction.aurelia"]?.completedResearchIds).toEqual([
      COMPOSITE_BOW_DOCTRINE_ID,
      ORGANIZED_LOGISTICS_ID,
    ]);
    expect(state.factions["faction.aurelia"]?.researchQueue).toBeUndefined();

    const march = executeCommand(state, {
      id: "command.research.leave",
      actorFactionId: "faction.aurelia",
      expectedRevision: 4,
      command: {
        type: "army.move",
        armyId: "army.first-frontier",
        destinationProvinceId: "province.river-crossing",
      },
    });
    expect(march.ok).toBe(true);
    const committed = executeCommand(state, {
      id: "command.research.commit-leave",
      actorFactionId: "faction.aurelia",
      expectedRevision: 5,
      command: { type: "strategic.end-turn" },
    });
    expect(committed.ok).toBe(true);
    const aurelia = state.factions["faction.aurelia"];
    if (aurelia) {
      aurelia.treasury = 200;
    }
    const recruited = executeCommand(state, {
      id: "command.research.recruit",
      actorFactionId: "faction.aurelia",
      expectedRevision: 6,
      command: { type: "army.recruit", provinceId: "province.western-gate" },
    });
    expect(recruited.ok).toBe(true);
    const levy = Object.values(state.armies).find((army) => army.id.startsWith("army.levy."));
    expect(levy?.strength).toBe(LEVY_RECRUIT_STRENGTH + COMPOSITE_BOW_LEVY_BONUS);
  });

  it("rejects a second project and ritual astronomy without a free queue", () => {
    const state = createSampleWorld(10);
    const first = executeCommand(state, {
      id: "command.research.first",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: { type: "research.select", researchId: COMPOSITE_BOW_DOCTRINE_ID },
    });
    expect(first.ok).toBe(true);
    const second = executeCommand(state, {
      id: "command.research.second",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "research.select", researchId: RITUAL_ASTRONOMY_ID },
    });
    expect(second.ok).toBe(false);
    if (second.ok) {
      return;
    }
    expect(second.error.code).toBe("already-researching");
  });
});
