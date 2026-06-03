import { describe, expect, it } from "vitest";
import { formatDisplayName } from "../formatDisplayName";

describe("formatDisplayName", () => {
  it("joins first and last name with a space", () => {
    expect(formatDisplayName("John", "Doe")).toBe("John Doe");
  });

  it("returns only first name when last name is missing", () => {
    expect(formatDisplayName("John", null)).toBe("John");
    expect(formatDisplayName("John", undefined)).toBe("John");
    expect(formatDisplayName("John", "")).toBe("John");
  });

  it("returns only last name when first name is missing", () => {
    expect(formatDisplayName(null, "Doe")).toBe("Doe");
    expect(formatDisplayName(undefined, "Doe")).toBe("Doe");
    expect(formatDisplayName("", "Doe")).toBe("Doe");
  });

  it("trims whitespace from names", () => {
    expect(formatDisplayName("  John  ", "  Doe  ")).toBe("John Doe");
  });

  it("returns fallback when both names are missing", () => {
    expect(formatDisplayName(null, null, "Guest")).toBe("Guest");
    expect(formatDisplayName(undefined, undefined, "Guest")).toBe("Guest");
    expect(formatDisplayName("", "", "Guest")).toBe("Guest");
  });

  it("trims whitespace from fallback", () => {
    expect(formatDisplayName(null, null, "  Guest  ")).toBe("Guest");
  });

  it("returns null when both names and fallback are missing", () => {
    expect(formatDisplayName(null, null)).toBeNull();
    expect(formatDisplayName(undefined, undefined)).toBeNull();
    expect(formatDisplayName("", "")).toBeNull();
  });

  it("returns null when both names are whitespace-only and no fallback", () => {
    expect(formatDisplayName("   ", "   ")).toBeNull();
  });

  it("uses fallback when names are whitespace-only", () => {
    expect(formatDisplayName("   ", "   ", "Guest")).toBe("Guest");
  });

  it("handles single name with whitespace-only other name", () => {
    expect(formatDisplayName("John", "   ")).toBe("John");
    expect(formatDisplayName("   ", "Doe")).toBe("Doe");
  });
});
