import type { FormationBattleState } from "./model";

function mix(hash: number, value: number): number {
  let next = hash >>> 0;
  const normalized = value | 0;
  next ^= normalized & 0xff;
  next = Math.imul(next, 16_777_619);
  next ^= (normalized >>> 8) & 0xff;
  next = Math.imul(next, 16_777_619);
  next ^= (normalized >>> 16) & 0xff;
  next = Math.imul(next, 16_777_619);
  next ^= (normalized >>> 24) & 0xff;
  next = Math.imul(next, 16_777_619);
  return next >>> 0;
}

/** Hashes authority only. Derived soldier sprites and visual density are deliberately excluded. */
export function hashBattleAuthority(state: FormationBattleState): string {
  let hash = 2_166_136_261;
  hash = mix(hash, state.schemaVersion);
  hash = mix(hash, state.tick);
  hash = mix(hash, state.count);

  for (let id = 0; id < state.count; id += 1) {
    hash = mix(hash, id);
    hash = mix(hash, state.active[id] ?? 0);
    hash = mix(hash, state.team[id] ?? 0);
    hash = mix(hash, state.anchorX[id] ?? 0);
    hash = mix(hash, state.anchorY[id] ?? 0);
    hash = mix(hash, state.targetX[id] ?? 0);
    hash = mix(hash, state.targetY[id] ?? 0);
    hash = mix(hash, state.speed[id] ?? 0);
    hash = mix(hash, state.spacing[id] ?? 0);
    hash = mix(hash, state.rows[id] ?? 0);
    hash = mix(hash, state.columns[id] ?? 0);
    hash = mix(hash, state.initialStrength[id] ?? 0);
    hash = mix(hash, state.strength[id] ?? 0);
    hash = mix(hash, state.morale[id] ?? 0);
    hash = mix(hash, state.cohesion[id] ?? 0);
  }

  return hash.toString(16).padStart(8, "0");
}
