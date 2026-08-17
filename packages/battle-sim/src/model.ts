export const BATTLE_SCHEMA_VERSION = 1 as const;

export type FormationId = number;

export interface FormationSpawn {
  team: number;
  anchorX: number;
  anchorY: number;
  rows: number;
  columns: number;
  spacing: number;
  strength: number;
  speed: number;
  morale?: number;
  cohesion?: number;
}

export interface FormationBattleState {
  schemaVersion: typeof BATTLE_SCHEMA_VERSION;
  tick: number;
  capacity: number;
  count: number;
  active: Uint8Array;
  team: Uint8Array;
  anchorX: Int32Array;
  anchorY: Int32Array;
  targetX: Int32Array;
  targetY: Int32Array;
  speed: Int32Array;
  spacing: Int32Array;
  rows: Uint16Array;
  columns: Uint16Array;
  initialStrength: Int32Array;
  strength: Int32Array;
  morale: Uint16Array;
  cohesion: Uint16Array;
}

export interface FormationRenderSnapshot {
  tick: number;
  visualCount: number;
  positions: Float32Array;
  teams: Uint8Array;
  formationIds: Uint32Array;
  active: Uint8Array;
}
