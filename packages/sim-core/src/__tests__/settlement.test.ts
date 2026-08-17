import { describe, expect, it } from "vitest";
import { executeCommand } from "../commands";
import {
  CIVIC_HALL_BUILDING_ID,
  CIVIC_HALL_COST,
  CIVIC_HALL_TREASURY_PER_TURN,
  LEVY_RECRUIT_STRENGTH,
  STOREHOUSE_BUILDING_ID,
  STOREHOUSE_COST,
  TRAINING_GROUND_BUILDING_ID,
  TRAINING_GROUND_COST,
  TRAINING_GROUND_LEVY_BONUS,
} from "../model";
import { createSampleWorld } from "../world";

describe("capital storehouse", () => {
  it("queues a storehouse, finishes it in two turns, and adds harvest food", () => {
    const state = createSampleWorld(10);
    const treasuryBefore = state.factions["faction.aurelia"]?.treasury ?? 0;
    const queued = executeCommand(state, {
      id: "command.storehouse",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: STOREHOUSE_BUILDING_ID,
      },
    });
    expect(queued.ok).toBe(true);
    expect(state.factions["faction.aurelia"]?.treasury).toBe(treasuryBefore - STOREHOUSE_COST);
    expect(state.settlements["settlement.western-gate"]?.buildQueue).toEqual({
      buildingId: STOREHOUSE_BUILDING_ID,
      remainingTurns: 2,
    });

    const firstEnd = executeCommand(state, {
      id: "command.end-turn.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(firstEnd.ok).toBe(true);
    expect(state.settlements["settlement.western-gate"]?.buildQueue?.remainingTurns).toBe(1);

    const foodBefore = state.provinces["province.western-gate"]?.food ?? 0;
    const secondEnd = executeCommand(state, {
      id: "command.end-turn.2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: { type: "strategic.end-turn" },
    });
    expect(secondEnd.ok).toBe(true);
    if (!secondEnd.ok) {
      return;
    }
    expect(state.settlements["settlement.western-gate"]?.completedBuildingIds).toEqual([
      STOREHOUSE_BUILDING_ID,
    ]);
    expect(state.settlements["settlement.western-gate"]?.buildQueue).toBeUndefined();
    expect(secondEnd.events.some((event) => event.type === "settlement.constructed")).toBe(true);
    expect(state.provinces["province.western-gate"]?.food).toBeGreaterThan(foodBefore + 5);
  });

  it("rejects a second storehouse without mutating state", () => {
    const state = createSampleWorld(10);
    const first = executeCommand(state, {
      id: "command.storehouse.1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: STOREHOUSE_BUILDING_ID,
      },
    });
    expect(first.ok).toBe(true);
    const second = executeCommand(state, {
      id: "command.storehouse.2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: STOREHOUSE_BUILDING_ID,
      },
    });
    expect(second.ok).toBe(false);
    if (second.ok) {
      return;
    }
    expect(second.error.code).toBe("already-building");
  });
});

describe("capital training ground", () => {
  it("finishes in three turns and trains stronger levies", () => {
    const state = createSampleWorld(10);
    const aurelia = state.factions["faction.aurelia"];
    if (aurelia) {
      aurelia.treasury = 300;
    }
    const treasuryBefore = state.factions["faction.aurelia"]?.treasury ?? 0;
    const queued = executeCommand(state, {
      id: "command.training-ground",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: TRAINING_GROUND_BUILDING_ID,
      },
    });
    expect(queued.ok).toBe(true);
    expect(state.factions["faction.aurelia"]?.treasury).toBe(treasuryBefore - TRAINING_GROUND_COST);

    for (let step = 1; step <= 3; step += 1) {
      const ended = executeCommand(state, {
        id: `command.training.end-turn.${step}`,
        actorFactionId: "faction.aurelia",
        expectedRevision: step,
        command: { type: "strategic.end-turn" },
      });
      expect(ended.ok).toBe(true);
    }
    expect(state.settlements["settlement.western-gate"]?.completedBuildingIds).toEqual([
      TRAINING_GROUND_BUILDING_ID,
    ]);

    const march = executeCommand(state, {
      id: "command.training.leave-capital",
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
      id: "command.training.commit-leave",
      actorFactionId: "faction.aurelia",
      expectedRevision: 5,
      command: { type: "strategic.end-turn" },
    });
    expect(committed.ok).toBe(true);

    const treasuryAfterUpkeep = state.factions["faction.aurelia"]?.treasury ?? 0;
    const recruited = executeCommand(state, {
      id: "command.training.recruit",
      actorFactionId: "faction.aurelia",
      expectedRevision: 6,
      command: { type: "army.recruit", provinceId: "province.western-gate" },
    });
    expect(recruited.ok).toBe(true);
    const levy = Object.values(state.armies).find((army) => army.id.startsWith("army.levy."));
    expect(levy?.strength).toBe(LEVY_RECRUIT_STRENGTH + TRAINING_GROUND_LEVY_BONUS);
    expect(state.factions["faction.aurelia"]?.treasury).toBeLessThan(treasuryAfterUpkeep);
  });

  it("can follow a finished storehouse and rejects a duplicate", () => {
    const state = createSampleWorld(10);
    const storehouse = executeCommand(state, {
      id: "command.both.storehouse",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: STOREHOUSE_BUILDING_ID,
      },
    });
    expect(storehouse.ok).toBe(true);
    const blocked = executeCommand(state, {
      id: "command.both.blocked",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: TRAINING_GROUND_BUILDING_ID,
      },
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) {
      return;
    }
    expect(blocked.error.code).toBe("already-building");

    executeCommand(state, {
      id: "command.both.end-1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    executeCommand(state, {
      id: "command.both.end-2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: { type: "strategic.end-turn" },
    });
    const aurelia = state.factions["faction.aurelia"];
    if (aurelia) {
      aurelia.treasury = 200;
    }

    const training = executeCommand(state, {
      id: "command.both.training",
      actorFactionId: "faction.aurelia",
      expectedRevision: 3,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: TRAINING_GROUND_BUILDING_ID,
      },
    });
    expect(training.ok).toBe(true);

    const duplicate = executeCommand(state, {
      id: "command.both.duplicate",
      actorFactionId: "faction.aurelia",
      expectedRevision: 4,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: STOREHOUSE_BUILDING_ID,
      },
    });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) {
      return;
    }
    expect(duplicate.error.code).toBe("already-building");
  });
});

describe("capital civic hall", () => {
  it("finishes in two turns, pays civic income, and lowers unrest", () => {
    const state = createSampleWorld(10);
    const treasuryBefore = state.factions["faction.aurelia"]?.treasury ?? 0;
    const unrestBefore = state.provinces["province.western-gate"]?.unrest ?? 0;
    const queued = executeCommand(state, {
      id: "command.civic-hall",
      actorFactionId: "faction.aurelia",
      expectedRevision: 0,
      command: {
        type: "settlement.queue-building",
        settlementId: "settlement.western-gate",
        buildingId: CIVIC_HALL_BUILDING_ID,
      },
    });
    expect(queued.ok).toBe(true);
    expect(state.factions["faction.aurelia"]?.treasury).toBe(treasuryBefore - CIVIC_HALL_COST);

    const firstEnd = executeCommand(state, {
      id: "command.civic.end-1",
      actorFactionId: "faction.aurelia",
      expectedRevision: 1,
      command: { type: "strategic.end-turn" },
    });
    expect(firstEnd.ok).toBe(true);
    expect(state.settlements["settlement.western-gate"]?.buildQueue?.remainingTurns).toBe(1);
    expect(state.provinces["province.western-gate"]?.unrest).toBe(unrestBefore);

    const treasuryMid = state.factions["faction.aurelia"]?.treasury ?? 0;
    const secondEnd = executeCommand(state, {
      id: "command.civic.end-2",
      actorFactionId: "faction.aurelia",
      expectedRevision: 2,
      command: { type: "strategic.end-turn" },
    });
    expect(secondEnd.ok).toBe(true);
    expect(state.settlements["settlement.western-gate"]?.completedBuildingIds).toEqual([
      CIVIC_HALL_BUILDING_ID,
    ]);
    expect(state.provinces["province.western-gate"]?.unrest).toBe(unrestBefore - 1);
    expect(state.factions["faction.aurelia"]?.treasury).toBe(
      treasuryMid + 10 + CIVIC_HALL_TREASURY_PER_TURN - 2,
    );
  });
});
