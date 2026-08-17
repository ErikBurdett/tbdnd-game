import { fromFixed, moveToward, toFixed } from "./fixed";
import {
  BATTLE_SCHEMA_VERSION,
  type FormationBattleState,
  type FormationId,
  type FormationSpawn,
} from "./model";

const PERCENT_SCALE = 10_000;

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
}

export function createFormationBattle(capacity = 256): FormationBattleState {
  assertIntegerInRange(capacity, 1, 65_535, "capacity");

  return {
    schemaVersion: BATTLE_SCHEMA_VERSION,
    tick: 0,
    capacity,
    count: 0,
    active: new Uint8Array(capacity),
    team: new Uint8Array(capacity),
    anchorX: new Int32Array(capacity),
    anchorY: new Int32Array(capacity),
    targetX: new Int32Array(capacity),
    targetY: new Int32Array(capacity),
    speed: new Int32Array(capacity),
    spacing: new Int32Array(capacity),
    rows: new Uint16Array(capacity),
    columns: new Uint16Array(capacity),
    initialStrength: new Int32Array(capacity),
    strength: new Int32Array(capacity),
    morale: new Uint16Array(capacity),
    cohesion: new Uint16Array(capacity),
  };
}

export function spawnFormation(state: FormationBattleState, spawn: FormationSpawn): FormationId {
  if (state.count >= state.capacity) {
    throw new Error(`Battle formation capacity ${state.capacity} has been reached.`);
  }
  assertIntegerInRange(spawn.team, 0, 255, "team");
  assertIntegerInRange(spawn.rows, 1, 65_535, "rows");
  assertIntegerInRange(spawn.columns, 1, 65_535, "columns");
  assertIntegerInRange(spawn.strength, 1, 2_000_000_000, "strength");
  if (!Number.isFinite(spawn.spacing) || spawn.spacing <= 0) {
    throw new Error("spacing must be a positive finite number.");
  }
  if (!Number.isFinite(spawn.speed) || spawn.speed <= 0) {
    throw new Error("speed must be a positive finite number.");
  }

  const morale = spawn.morale ?? 100;
  const cohesion = spawn.cohesion ?? 100;
  assertIntegerInRange(morale, 0, 100, "morale");
  assertIntegerInRange(cohesion, 0, 100, "cohesion");

  const id = state.count;
  state.count += 1;
  state.active[id] = 1;
  state.team[id] = spawn.team;
  state.anchorX[id] = toFixed(spawn.anchorX);
  state.anchorY[id] = toFixed(spawn.anchorY);
  state.targetX[id] = state.anchorX[id] ?? 0;
  state.targetY[id] = state.anchorY[id] ?? 0;
  state.speed[id] = toFixed(spawn.speed);
  state.spacing[id] = toFixed(spawn.spacing);
  state.rows[id] = spawn.rows;
  state.columns[id] = spawn.columns;
  state.initialStrength[id] = spawn.strength;
  state.strength[id] = spawn.strength;
  state.morale[id] = Math.round((morale / 100) * PERCENT_SCALE);
  state.cohesion[id] = Math.round((cohesion / 100) * PERCENT_SCALE);
  return id;
}

function assertActiveFormation(state: FormationBattleState, formationId: FormationId): void {
  if (!Number.isInteger(formationId) || formationId < 0 || formationId >= state.count) {
    throw new Error(`Unknown formation ${formationId}.`);
  }
  if (state.active[formationId] !== 1) {
    throw new Error(`Formation ${formationId} is not active.`);
  }
}

export function issueFormationMove(
  state: FormationBattleState,
  formationId: FormationId,
  targetX: number,
  targetY: number,
): void {
  assertActiveFormation(state, formationId);
  state.targetX[formationId] = toFixed(targetX);
  state.targetY[formationId] = toFixed(targetY);
}

export function applyFormationCasualties(
  state: FormationBattleState,
  formationId: FormationId,
  casualties: number,
): void {
  assertActiveFormation(state, formationId);
  assertIntegerInRange(casualties, 0, 2_000_000_000, "casualties");
  const currentStrength = state.strength[formationId] ?? 0;
  const nextStrength = Math.max(0, currentStrength - casualties);
  state.strength[formationId] = nextStrength;
  if (nextStrength === 0) {
    state.active[formationId] = 0;
  }
}

/**
 * Advances one deterministic movement phase. Formations are processed by ascending ID.
 * The prototype intentionally uses axis movement; later steering must preserve integer math,
 * stable ordering, and outcome independence from render density.
 */
export function stepFormationMovement(state: FormationBattleState): void {
  for (let formationId = 0; formationId < state.count; formationId += 1) {
    if (state.active[formationId] !== 1) {
      continue;
    }
    const maximumDelta = state.speed[formationId] ?? 0;
    state.anchorX[formationId] = moveToward(
      state.anchorX[formationId] ?? 0,
      state.targetX[formationId] ?? 0,
      maximumDelta,
    );
    state.anchorY[formationId] = moveToward(
      state.anchorY[formationId] ?? 0,
      state.targetY[formationId] ?? 0,
      maximumDelta,
    );
  }
  state.tick += 1;
}

export function getFormationPosition(
  state: FormationBattleState,
  formationId: FormationId,
): Readonly<{ x: number; y: number }> {
  assertActiveFormation(state, formationId);
  return {
    x: fromFixed(state.anchorX[formationId] ?? 0),
    y: fromFixed(state.anchorY[formationId] ?? 0),
  };
}
