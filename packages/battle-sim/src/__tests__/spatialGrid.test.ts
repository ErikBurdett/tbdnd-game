import { describe, expect, it } from "vitest";
import { UniformGridIndex } from "../index";

describe("UniformGridIndex", () => {
  it("returns stable, sorted candidates from neighboring cells", () => {
    const grid = new UniformGridIndex(256);
    grid.insert(7, 0, 0);
    grid.insert(2, 128, 0);
    grid.insert(9, 2_000, 2_000);
    expect(grid.query(0, 0, 300)).toEqual([2, 7]);
  });
});
