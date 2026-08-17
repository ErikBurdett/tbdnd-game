import { describe, expect, it } from "vitest";
import {
  applyFormationCasualties,
  buildFormationRenderSnapshot,
  createFormationBattle,
  getFormationPosition,
  hashBattleAuthority,
  issueFormationMove,
  spawnFormation,
  stepFormationMovement,
} from "../index";

function createFixture() {
  const state = createFormationBattle(8);
  const blue = spawnFormation(state, {
    team: 0,
    anchorX: 10,
    anchorY: 20,
    rows: 40,
    columns: 50,
    spacing: 1.25,
    strength: 2_000,
    speed: 2,
  });
  const red = spawnFormation(state, {
    team: 1,
    anchorX: 180,
    anchorY: 20,
    rows: 40,
    columns: 50,
    spacing: 1.25,
    strength: 2_000,
    speed: 2,
  });
  issueFormationMove(state, blue, 100, 20);
  issueFormationMove(state, red, 90, 20);
  return { state, blue, red };
}

describe("formation battle", () => {
  it("replays deterministic movement to the same authority hash", () => {
    const first = createFixture();
    const second = createFixture();

    for (let step = 0; step < 20; step += 1) {
      stepFormationMovement(first.state);
      stepFormationMovement(second.state);
    }

    expect(hashBattleAuthority(first.state)).toBe(hashBattleAuthority(second.state));
    expect(getFormationPosition(first.state, first.blue)).toEqual({ x: 50, y: 20 });
  });

  it("keeps visual density outside battle authority", () => {
    const { state, blue } = createFixture();
    const before = hashBattleAuthority(state);
    const sparse = buildFormationRenderSnapshot(state, 0.1);
    const dense = buildFormationRenderSnapshot(state, 1);

    expect(sparse.visualCount).toBe(400);
    expect(dense.visualCount).toBe(4_000);
    expect(hashBattleAuthority(state)).toBe(before);

    applyFormationCasualties(state, blue, 1_000);
    const depleted = buildFormationRenderSnapshot(state, 1);
    expect(depleted.visualCount).toBe(3_000);
  });
});
