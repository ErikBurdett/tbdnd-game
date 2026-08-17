import { fromFixed } from "./fixed";
import type { FormationBattleState, FormationRenderSnapshot } from "./model";

function visualCapacityForFormation(
  state: FormationBattleState,
  formationId: number,
  density: number,
): number {
  const rows = state.rows[formationId] ?? 0;
  const columns = state.columns[formationId] ?? 0;
  const slots = rows * columns;
  return Math.max(1, Math.ceil(slots * density));
}

function livingVisualsForFormation(
  state: FormationBattleState,
  formationId: number,
  density: number,
): number {
  if (state.active[formationId] !== 1) {
    return 0;
  }
  const initialStrength = state.initialStrength[formationId] ?? 0;
  const strength = state.strength[formationId] ?? 0;
  if (initialStrength <= 0 || strength <= 0) {
    return 0;
  }
  const capacity = visualCapacityForFormation(state, formationId, density);
  return Math.max(1, Math.min(capacity, Math.floor((capacity * strength) / initialStrength)));
}

/**
 * Derives disposable visual soldiers from formation authority.
 * This function never mutates authoritative battle state.
 */
export function buildFormationRenderSnapshot(
  state: FormationBattleState,
  density = 1,
): FormationRenderSnapshot {
  if (!Number.isFinite(density) || density <= 0 || density > 1) {
    throw new Error("Visual density must be greater than zero and at most one.");
  }

  let visualCount = 0;
  for (let formationId = 0; formationId < state.count; formationId += 1) {
    visualCount += livingVisualsForFormation(state, formationId, density);
  }

  const positions = new Float32Array(visualCount * 2);
  const teams = new Uint8Array(visualCount);
  const formationIds = new Uint32Array(visualCount);
  const active = new Uint8Array(visualCount);

  let writeIndex = 0;
  for (let formationId = 0; formationId < state.count; formationId += 1) {
    const livingVisuals = livingVisualsForFormation(state, formationId, density);
    if (livingVisuals === 0) {
      continue;
    }

    const fullRows = state.rows[formationId] ?? 1;
    const fullColumns = state.columns[formationId] ?? 1;
    const sampledColumns = Math.max(1, Math.min(fullColumns, Math.ceil(Math.sqrt(livingVisuals))));
    const sampledRows = Math.max(1, Math.ceil(livingVisuals / sampledColumns));
    const spacing = fromFixed(state.spacing[formationId] ?? 0);
    const anchorX = fromFixed(state.anchorX[formationId] ?? 0);
    const anchorY = fromFixed(state.anchorY[formationId] ?? 0);
    const width = (sampledColumns - 1) * spacing;
    const height = (sampledRows - 1) * spacing;

    for (let localIndex = 0; localIndex < livingVisuals; localIndex += 1) {
      const column = localIndex % sampledColumns;
      const row = Math.floor(localIndex / sampledColumns);
      const positionOffset = writeIndex * 2;
      positions[positionOffset] = anchorX + column * spacing - width / 2;
      positions[positionOffset + 1] = anchorY + row * spacing - height / 2;
      teams[writeIndex] = state.team[formationId] ?? 0;
      formationIds[writeIndex] = formationId;
      active[writeIndex] = 1;
      writeIndex += 1;
    }

    // Read these to make the formation dimensions explicit in debug builds and future rotation work.
    void fullRows;
  }

  return {
    tick: state.tick,
    visualCount,
    positions,
    teams,
    formationIds,
    active,
  };
}
