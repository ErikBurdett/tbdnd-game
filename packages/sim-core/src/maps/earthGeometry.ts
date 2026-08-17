import { EARTH_MAP, type EarthProvinceRecord } from "./earthWorld";

export type EarthLod = "far" | "mid" | "near";

export interface EarthViewBounds {
  x: number;
  y: number;
  right: number;
  bottom: number;
}

export interface EarthDrawBatch {
  x: number;
  y: number;
  w: number;
  h: number;
  ownerId: string;
  stroke: boolean;
  provinceIds: string[];
}

export interface EarthLabelPick {
  id: string;
  name: string;
  x: number;
  y: number;
  fontSize: number;
}

export interface EarthLabelContext {
  selectedId?: string;
  legalIds: readonly string[];
  armyProvinceIds: readonly string[];
  owners: Record<string, string | undefined>;
}

const byId = new Map<string, EarthProvinceRecord>();
const byCell = new Map<string, EarthProvinceRecord>();
const capitalIds = new Set(
  EARTH_MAP.factions.map((faction) => faction.capitalId).filter((id) => id.length > 0),
);

for (const province of EARTH_MAP.provinces) {
  byId.set(province.id, province);
  byCell.set(`${province.col},${province.row}`, province);
}

export const EARTH_NUMBERED_LABEL_MIN_ZOOM = 2.15;

export function earthCellSize(): number {
  return EARTH_MAP.cellDegrees * EARTH_MAP.mapScale;
}

export function getEarthProvince(provinceId: string): EarthProvinceRecord | undefined {
  return byId.get(provinceId);
}

export function getEarthProvinceAtCell(col: number, row: number): EarthProvinceRecord | undefined {
  return byCell.get(`${col},${row}`);
}

export function worldToEarthCell(worldX: number, worldY: number): { col: number; row: number } {
  const lon = EARTH_MAP.lonMin + worldX / EARTH_MAP.mapScale;
  const lat = EARTH_MAP.latTop - worldY / EARTH_MAP.mapScale;
  return {
    col: Math.floor((lon - EARTH_MAP.lonMin) / EARTH_MAP.cellDegrees),
    row: Math.floor((EARTH_MAP.latMax - lat) / EARTH_MAP.cellDegrees),
  };
}

export function getEarthProvinceAtWorld(
  worldX: number,
  worldY: number,
): EarthProvinceRecord | undefined {
  const { col, row } = worldToEarthCell(worldX, worldY);
  return getEarthProvinceAtCell(col, row);
}

export function earthLodForZoom(zoom: number): EarthLod {
  if (zoom < 0.45) {
    return "far";
  }
  if (zoom < 1.55) {
    return "mid";
  }
  return "near";
}

export function earthLodStep(lod: EarthLod): number {
  if (lod === "far") {
    return 4;
  }
  if (lod === "mid") {
    return 2;
  }
  return 1;
}

export function earthLabelCap(lod: EarthLod): number {
  if (lod === "far") {
    return 12;
  }
  if (lod === "mid") {
    return 22;
  }
  return 36;
}

export function earthShowsNumberedLabels(zoom: number): boolean {
  return earthLodForZoom(zoom) === "near" && zoom >= EARTH_NUMBERED_LABEL_MIN_ZOOM;
}

export function listEarthDrawBatches(
  bounds: EarthViewBounds,
  zoom: number,
  owners: Record<string, string | undefined>,
): EarthDrawBatch[] {
  const lod = earthLodForZoom(zoom);
  const step = earthLodStep(lod);
  const cell = earthCellSize();
  const pad = step * cell;
  const start = worldToEarthCell(bounds.x - pad, bounds.y - pad);
  const end = worldToEarthCell(bounds.right + pad, bounds.bottom + pad);
  const minCol = Math.floor(Math.min(start.col, end.col) / step) * step;
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.floor(Math.min(start.row, end.row) / step) * step;
  const maxRow = Math.max(start.row, end.row);
  const batches: EarthDrawBatch[] = [];
  const seen = new Set<string>();

  for (let originRow = minRow; originRow <= maxRow; originRow += step) {
    for (let originCol = minCol; originCol <= maxCol; originCol += step) {
      const key = `${originCol},${originRow}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const block: EarthProvinceRecord[] = [];
      for (let row = originRow; row < originRow + step; row += 1) {
        for (let col = originCol; col < originCol + step; col += 1) {
          const province = getEarthProvinceAtCell(col, row);
          if (province) {
            block.push(province);
          }
        }
      }
      if (block.length === 0) {
        continue;
      }

      const ownerId = majorityOwner(block, owners);
      const origin = getEarthProvinceAtCell(originCol, originRow);
      const solid = block.length === step * step && origin !== undefined;
      if (solid && origin && step > 1) {
        batches.push({
          x: origin.x,
          y: origin.y,
          w: cell * step,
          h: cell * step,
          ownerId,
          stroke: blockNeedsStroke(originCol, originRow, step, ownerId, owners),
          provinceIds: block.map((province) => province.id),
        });
        continue;
      }

      for (const province of block) {
        const cellOwner = owners[province.id] ?? province.ownerId;
        batches.push({
          x: province.x,
          y: province.y,
          w: province.w,
          h: province.h,
          ownerId: cellOwner,
          stroke: lod === "near" || cellNeedsStroke(province, cellOwner, owners),
          provinceIds: [province.id],
        });
      }
    }
  }

  return batches;
}

export function pickEarthLabels(
  bounds: EarthViewBounds,
  zoom: number,
  context: EarthLabelContext,
): EarthLabelPick[] {
  const lod = earthLodForZoom(zoom);
  const showNumbered = earthShowsNumberedLabels(zoom);
  const legal = new Set(context.legalIds);
  const armySites = new Set(context.armyProvinceIds);
  const candidates: Array<EarthLabelPick & { priority: number }> = [];

  for (const province of EARTH_MAP.provinces) {
    const selected = context.selectedId === province.id;
    const legalDest = legal.has(province.id);
    const hasArmy = armySites.has(province.id);
    const inView =
      province.labelX >= bounds.x &&
      province.labelX <= bounds.right &&
      province.labelY >= bounds.y &&
      province.labelY <= bounds.bottom;
    if (!inView && !selected && !legalDest) {
      continue;
    }

    const named = province.named;
    const capital = capitalIds.has(province.id);
    if (!selected && !legalDest && !hasArmy) {
      if (lod === "far" && !capital) {
        continue;
      }
      if (!named && !showNumbered) {
        continue;
      }
    }

    const owned = context.owners[province.id];
    const name =
      !owned && !named && !selected && !legalDest
        ? "Unscouted land"
        : (getEarthProvince(province.id)?.name ?? province.id);
    if (name === "Unscouted land" && !selected && !legalDest) {
      continue;
    }

    candidates.push({
      id: province.id,
      name,
      x: province.labelX,
      y: province.labelY,
      fontSize: lod === "near" ? 12 : lod === "mid" ? 13 : 15,
      priority: labelPriority({
        selected,
        legalDest,
        hasArmy,
        capital,
        named,
      }),
    });
  }

  candidates.sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );

  const minSeparation = (lod === "far" ? 96 : lod === "mid" ? 78 : 58) / Math.max(zoom, 0.12);
  const accepted: EarthLabelPick[] = [];
  const occupied: Array<{ x: number; y: number }> = [];

  for (const candidate of candidates) {
    if (accepted.length >= earthLabelCap(lod)) {
      break;
    }
    const forced = candidate.priority >= 80;
    if (
      !forced &&
      occupied.some((point) => distance(point.x, point.y, candidate.x, candidate.y) < minSeparation)
    ) {
      continue;
    }
    accepted.push({
      id: candidate.id,
      name: candidate.name,
      x: candidate.x,
      y: candidate.y,
      fontSize: candidate.fontSize,
    });
    occupied.push({ x: candidate.x, y: candidate.y });
  }

  return accepted;
}

function labelPriority(flags: {
  selected: boolean;
  legalDest: boolean;
  hasArmy: boolean;
  capital: boolean;
  named: boolean;
}): number {
  if (flags.selected) {
    return 100;
  }
  if (flags.legalDest) {
    return 80;
  }
  if (flags.hasArmy) {
    return 60;
  }
  if (flags.capital) {
    return 40;
  }
  if (flags.named) {
    return 20;
  }
  return 4;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function majorityOwner(
  block: EarthProvinceRecord[],
  owners: Record<string, string | undefined>,
): string {
  const counts = new Map<string, number>();
  let best = block[0]?.ownerId ?? "";
  let bestCount = 0;
  for (const cell of block) {
    const ownerId = owners[cell.id] ?? cell.ownerId;
    const next = (counts.get(ownerId) ?? 0) + 1;
    counts.set(ownerId, next);
    if (next > bestCount || (next === bestCount && ownerId.localeCompare(best) < 0)) {
      best = ownerId;
      bestCount = next;
    }
  }
  return best;
}

function blockNeedsStroke(
  originCol: number,
  originRow: number,
  step: number,
  ownerId: string,
  owners: Record<string, string | undefined>,
): boolean {
  for (let index = 0; index < step; index += 1) {
    const neighbors: Array<[number, number]> = [
      [originCol - 1, originRow + index],
      [originCol + step, originRow + index],
      [originCol + index, originRow - 1],
      [originCol + index, originRow + step],
    ];
    for (const [col, row] of neighbors) {
      const neighbor = getEarthProvinceAtCell(col, row);
      if (!neighbor) {
        return true;
      }
      if ((owners[neighbor.id] ?? neighbor.ownerId) !== ownerId) {
        return true;
      }
    }
  }
  return false;
}

function cellNeedsStroke(
  province: EarthProvinceRecord,
  ownerId: string,
  owners: Record<string, string | undefined>,
): boolean {
  const sides: Array<[number, number]> = [
    [province.col - 1, province.row],
    [province.col + 1, province.row],
    [province.col, province.row - 1],
    [province.col, province.row + 1],
  ];
  for (const [col, row] of sides) {
    const neighbor = getEarthProvinceAtCell(col, row);
    if (!neighbor) {
      return true;
    }
    if ((owners[neighbor.id] ?? neighbor.ownerId) !== ownerId) {
      return true;
    }
  }
  return false;
}
