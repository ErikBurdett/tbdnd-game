export class UniformGridIndex {
  readonly cellSize: number;
  readonly #buckets = new Map<string, number[]>();

  constructor(cellSize: number) {
    if (!Number.isInteger(cellSize) || cellSize <= 0) {
      throw new Error(
        "cellSize must be a positive integer in the same fixed-point units as positions.",
      );
    }
    this.cellSize = cellSize;
  }

  clear(): void {
    this.#buckets.clear();
  }

  insert(id: number, x: number, y: number): void {
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("Spatial IDs must be non-negative integers.");
    }
    const key = this.#key(this.#cell(x), this.#cell(y));
    const bucket = this.#buckets.get(key);
    if (bucket) {
      bucket.push(id);
    } else {
      this.#buckets.set(key, [id]);
    }
  }

  query(x: number, y: number, radius: number): number[] {
    if (!Number.isInteger(radius) || radius < 0) {
      throw new Error("radius must be a non-negative integer.");
    }
    const minimumX = this.#cell(x - radius);
    const maximumX = this.#cell(x + radius);
    const minimumY = this.#cell(y - radius);
    const maximumY = this.#cell(y + radius);
    const found = new Set<number>();

    for (let cellY = minimumY; cellY <= maximumY; cellY += 1) {
      for (let cellX = minimumX; cellX <= maximumX; cellX += 1) {
        const bucket = this.#buckets.get(this.#key(cellX, cellY));
        if (!bucket) {
          continue;
        }
        for (const id of bucket) {
          found.add(id);
        }
      }
    }

    return [...found].sort((left, right) => left - right);
  }

  #cell(value: number): number {
    return Math.floor(value / this.cellSize);
  }

  #key(x: number, y: number): string {
    return `${x}:${y}`;
  }
}
