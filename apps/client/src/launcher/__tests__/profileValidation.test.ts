import { describe, expect, it } from "vitest";
import { normalizeProfileDraft, validateProfileDraft } from "../profileValidation";

describe("profileValidation", () => {
  it("accepts a trimmed commander name", () => {
    expect(
      validateProfileDraft(normalizeProfileDraft({ name: "  Aurelian  ", motto: " Hold. " })),
    ).toBeUndefined();
  });

  it("rejects a short name", () => {
    expect(validateProfileDraft({ name: "A", motto: "" })?.field).toBe("name");
  });

  it("rejects an overlong motto", () => {
    expect(validateProfileDraft({ name: "Aurelian", motto: "x".repeat(81) })?.field).toBe("motto");
  });

  it("rejects control characters in the name", () => {
    expect(validateProfileDraft({ name: "Au\nrelian", motto: "" })?.field).toBe("name");
  });
});
