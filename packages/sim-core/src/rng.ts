const DEFAULT_NON_ZERO_SEED = 0x6d2b_79f5;

export class Rng32 {
  private stateValue: number;

  public constructor(seed: number) {
    const normalized = seed >>> 0;
    this.stateValue = normalized === 0 ? DEFAULT_NON_ZERO_SEED : normalized;
  }

  public nextU32(): number {
    this.stateValue = (this.stateValue + 0x6d2b_79f5) >>> 0;
    let value = this.stateValue;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  public intInclusive(minimum: number, maximum: number): number {
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum) {
      throw new RangeError(`Invalid integer range: ${minimum}..${maximum}`);
    }

    const span = maximum - minimum + 1;
    if (span <= 0 || span > 0x1_0000_0000) {
      throw new RangeError(`Range is too large for a 32-bit RNG: ${minimum}..${maximum}`);
    }

    // Rejection sampling avoids modulo bias.
    const limit = Math.floor(0x1_0000_0000 / span) * span;
    let roll = this.nextU32();
    while (roll >= limit) {
      roll = this.nextU32();
    }

    return minimum + (roll % span);
  }

  public getState(): number {
    return this.stateValue >>> 0;
  }
}

export function deriveSeed(rootSeed: number, scope: string): number {
  let hash = (0x811c_9dc5 ^ (rootSeed >>> 0)) >>> 0;
  for (let index = 0; index < scope.length; index += 1) {
    hash ^= scope.charCodeAt(index);
    hash = Math.imul(hash, 0x0100_0193) >>> 0;
  }
  return hash === 0 ? DEFAULT_NON_ZERO_SEED : hash;
}
