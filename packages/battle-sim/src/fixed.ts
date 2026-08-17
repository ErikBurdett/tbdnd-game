export const POSITION_SCALE = 256;

export function toFixed(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot convert non-finite value ${value} to fixed point.`);
  }
  return Math.round(value * POSITION_SCALE);
}

export function fromFixed(value: number): number {
  return value / POSITION_SCALE;
}

export function moveToward(current: number, target: number, maximumDelta: number): number {
  if (maximumDelta < 0) {
    throw new Error("maximumDelta must be non-negative.");
  }
  if (current < target) {
    return Math.min(current + maximumDelta, target);
  }
  if (current > target) {
    return Math.max(current - maximumDelta, target);
  }
  return current;
}
