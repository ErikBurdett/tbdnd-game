import { describe, expect, it } from "vitest";
import { deriveSeed, Rng32 } from "../index";

describe("Rng32", () => {
  it("replays an identical sequence from a stored state", () => {
    const first = new Rng32(123);
    const prefix = [first.nextU32(), first.nextU32()];
    const checkpoint = first.getState();
    const suffix = [first.nextU32(), first.nextU32(), first.nextU32()];

    const resumed = new Rng32(checkpoint);

    expect(prefix).toHaveLength(2);
    expect([resumed.nextU32(), resumed.nextU32(), resumed.nextU32()]).toEqual(suffix);
  });

  it("derives independent stable stream seeds", () => {
    expect(deriveSeed(10, "battle:a")).toBe(deriveSeed(10, "battle:a"));
    expect(deriveSeed(10, "battle:a")).not.toBe(deriveSeed(10, "battle:b"));
  });

  it("returns values within inclusive integer bounds", () => {
    const rng = new Rng32(77);
    for (let index = 0; index < 1_000; index += 1) {
      const value = rng.intInclusive(-3, 4);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThanOrEqual(4);
    }
  });
});
