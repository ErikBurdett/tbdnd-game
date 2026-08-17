function canonicalize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new TypeError("Authoritative state cannot contain non-finite numbers.");
      }
      return Object.is(value, -0) ? "0" : JSON.stringify(value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalize(item)).join(",")}]`;
      }

      const record = value as Record<string, unknown>;
      const entries = Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
      return `{${entries.join(",")}}`;
    }
    default:
      throw new TypeError(`Unsupported authoritative value type: ${typeof value}`);
  }
}

export function canonicalStringify(value: unknown): string {
  return canonicalize(value);
}

export function stableHash(value: unknown): string {
  const canonical = canonicalStringify(value);
  let hash = 0x811c_9dc5;

  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x0100_0193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
