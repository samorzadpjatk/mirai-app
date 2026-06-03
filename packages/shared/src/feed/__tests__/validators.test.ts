import { describe, it, expect } from "vitest";
import { buildUpdateActivityData, validateActivityVisibility } from "../validators";

describe("buildUpdateActivityData", () => {
  it("returns empty object for empty input", () => {
    const result = buildUpdateActivityData({});
    expect(result).toEqual({});
  });

  it("includes title when provided", () => {
    const result = buildUpdateActivityData({ title: "New Title" });
    expect(result).toEqual({ title: "New Title" });
  });

  it("includes description when provided", () => {
    const result = buildUpdateActivityData({ description: "New Description" });
    expect(result).toEqual({ description: "New Description" });
  });

  it("includes isPinned when provided", () => {
    const result = buildUpdateActivityData({ isPinned: true });
    expect(result).toEqual({ isPinned: true });
  });

  it("includes multiple fields when provided", () => {
    const result = buildUpdateActivityData({
      title: "T",
      description: "D",
      isPinned: false,
    });
    expect(result).toEqual({ title: "T", description: "D", isPinned: false });
  });

  it("does not include undefined fields", () => {
    const result = buildUpdateActivityData({ title: "Only Title" });
    expect(result).toHaveProperty("title");
    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("isPinned");
  });

  it("handles null description", () => {
    const result = buildUpdateActivityData({ description: null });
    expect(result).toEqual({ description: null });
  });

  it("does not include fields with undefined values", () => {
    const result = buildUpdateActivityData({
      title: undefined,
      description: "Present",
    });
    expect(result).not.toHaveProperty("title");
    expect(result).toHaveProperty("description", "Present");
  });
});

describe("validateActivityVisibility", () => {
  it("returns null when activity is not hidden", () => {
    const result = validateActivityVisibility(false);
    expect(result).toBeNull();
  });

  it("returns error when activity is hidden", () => {
    const result = validateActivityVisibility(true);
    expect(result).toEqual({
      error: "FORBIDDEN",
      message: "This activity is hidden",
    });
  });
});
