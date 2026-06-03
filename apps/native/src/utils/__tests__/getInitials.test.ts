import { describe, expect, it } from "@jest/globals";
import { getInitials } from "@mirai-app/shared";

describe("getInitials", () => {
  it("should return initials from first and last name", () => {
    expect(getInitials("John", "Doe")).toBe("JD");
  });

  it("should return single initial when only first name provided", () => {
    expect(getInitials("Jane", null)).toBe("J");
  });

  it("should return single initial when only last name provided", () => {
    expect(getInitials(null, "Smith")).toBe("S");
  });

  it("should return fallback when no names provided", () => {
    expect(getInitials(null, null)).toBe("?");
  });

  it("should return custom fallback when provided", () => {
    expect(getInitials(null, null, "X")).toBe("X");
  });

  it("should handle empty strings", () => {
    expect(getInitials("", "")).toBe("?");
  });

  it("should uppercase initials", () => {
    expect(getInitials("john", "doe")).toBe("JD");
  });
});
