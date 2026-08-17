export const MIN_ZOOM = 0.16;
export const MAX_ZOOM = 4.6;
export const START_ZOOM = 0.92;
export const FOCUS_ZOOM = 1.2;
export const ZOOM_STEP = 1.18;
export const WHEEL_ZOOM_SENSITIVITY = 0.0016;
export const PAN_SPEED_WORLD = 520;

export interface HeldPanKeys {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function zoomAfterWheel(zoom: number, deltaY: number): number {
  const factor = Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);
  return clampZoom(zoom * factor);
}

export function zoomAfterStep(zoom: number, direction: 1 | -1): number {
  return clampZoom(direction > 0 ? zoom * ZOOM_STEP : zoom / ZOOM_STEP);
}

export function focusZoom(currentZoom: number): number {
  return currentZoom < 0.7 ? FOCUS_ZOOM : currentZoom;
}

export function panOffset(
  held: HeldPanKeys,
  deltaMs: number,
  zoom: number,
): {
  x: number;
  y: number;
} {
  let x = 0;
  let y = 0;
  if (held.left) {
    x -= 1;
  }
  if (held.right) {
    x += 1;
  }
  if (held.up) {
    y -= 1;
  }
  if (held.down) {
    y += 1;
  }
  if (x === 0 && y === 0) {
    return { x: 0, y: 0 };
  }
  const length = Math.hypot(x, y);
  const speed = (PAN_SPEED_WORLD / Math.max(zoom, 0.12)) * (deltaMs / 1000);
  return { x: (x / length) * speed, y: (y / length) * speed };
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
