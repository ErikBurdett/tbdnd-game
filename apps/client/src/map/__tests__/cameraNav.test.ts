import { describe, expect, it } from "vitest";
import {
  clampZoom,
  focusZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  panOffset,
  zoomAfterStep,
  zoomAfterWheel,
} from "../cameraNav";

describe("camera navigation", () => {
  it("zooms toward the pointer with smooth wheel steps", () => {
    const inward = zoomAfterWheel(1, -100);
    const outward = zoomAfterWheel(1, 100);
    expect(inward).toBeGreaterThan(1);
    expect(outward).toBeLessThan(1);
    expect(zoomAfterWheel(1, 0)).toBe(1);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(20)).toBe(MAX_ZOOM);
  });

  it("keeps a close zoom when framing a selection", () => {
    expect(focusZoom(0.4)).toBeGreaterThan(0.7);
    expect(focusZoom(2.1)).toBe(2.1);
    expect(zoomAfterStep(1, 1)).toBeGreaterThan(1);
    expect(zoomAfterStep(1, -1)).toBeLessThan(1);
  });

  it("pans diagonally without going faster than a single axis", () => {
    const right = panOffset({ left: false, right: true, up: false, down: false }, 1000, 1);
    const diagonal = panOffset({ left: false, right: true, up: true, down: false }, 1000, 1);
    expect(right.x).toBeGreaterThan(0);
    expect(right.y).toBe(0);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(right.x, 5);
  });
});
