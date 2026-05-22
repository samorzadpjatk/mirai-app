import { describe, it, expect } from "vitest";
import { getInitials } from "../getInitials";

describe("getInitials", () => {
  it("returns uppercase initials for first and last name", () => {
    expect(getInitials("John", "Doe")).toBe("JD");
  });

  it("returns uppercase initial for first name only", () => {
    expect(getInitials("John", null)).toBe("J");
    expect(getInitials("John", undefined)).toBe("J");
    expect(getInitials("John", "")).toBe("J");
  });

  it("returns uppercase initial for last name only", () => {
    expect(getInitials(null, "Doe")).toBe("D");
    expect(getInitials(undefined, "Doe")).toBe("D");
    expect(getInitials("", "Doe")).toBe("D");
  });

  it("returns fallback when both names are missing", () => {
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials(undefined, undefined)).toBe("?");
    expect(getInitials("", "")).toBe("?");
  });

  it("returns custom fallback when both names are missing", () => {
    expect(getInitials(null, null, "X")).toBe("X");
    expect(getInitials("", "", "N/A")).toBe("N/A");
  });

  it("handles lowercase input", () => {
    expect(getInitials("john", "doe")).toBe("JD");
  });

  it("handles unicode characters", () => {
    expect(getInitials("Łukasz", "Nowak")).toBe("ŁN");
    expect(getInitials("Anna", "Müller")).toBe("AM");
  });

  it("handles names with spaces", () => {
    expect(getInitials("Mary Jane", "Watson")).toBe("MW");
  });

  it("ignores everything after first character", () => {
    expect(getInitials("Alexander", "Hamilton")).toBe("AH");
  });

  it("handles single-character names", () => {
    expect(getInitials("A", "B")).toBe("AB");
  });

  it("returns spaces as initials for whitespace-only input", () => {
    expect(getInitials("   ", "   ")).toBe("  ");
  });

  it("returns fallback when both inputs are empty strings", () => {
    expect(getInitials("", "", "F")).toBe("F");
  });
});
