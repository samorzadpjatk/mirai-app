import { describe, expect, it } from "@jest/globals";
import {
  formatBanLabel,
  formatDate,
  getInitials,
  isBanReady,
  isNameValid,
  isNonEmptyString,
} from "../validation";

describe("Validation Utilities", () => {
  describe("formatDate", () => {
    it("should format date string correctly", () => {
      expect(formatDate("2024-03-15")).toBe("2024-03-15");
    });

    it("should format Date object correctly", () => {
      const date = new Date(2024, 2, 15);
      expect(formatDate(date)).toBe("2024-03-15");
    });

    it("should return empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    it("should return empty string for invalid date string", () => {
      expect(formatDate("invalid")).toBe("");
    });

    it("should pad single digit month and day", () => {
      const date = new Date(2024, 0, 5);
      expect(formatDate(date)).toBe("2024-01-05");
    });
  });

  describe("getInitials", () => {
    it("should get initials from full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("should get initials from single name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("should handle multiple spaces", () => {
      expect(getInitials("John   Doe")).toBe("JD");
    });

    it("should return ? for empty string", () => {
      expect(getInitials("")).toBe("?");
    });

    it("should return ? for whitespace only", () => {
      expect(getInitials("   ")).toBe("?");
    });

    it("should convert to uppercase", () => {
      expect(getInitials("john doe")).toBe("JD");
    });

    it("should handle three names", () => {
      expect(getInitials("John Michael Doe")).toBe("JD");
    });

    it("should handle names with special characters", () => {
      expect(getInitials("John-Doe")).toBe("J");
    });

    it("should handle single character name", () => {
      expect(getInitials("J")).toBe("J");
    });

    it("should handle two single character names", () => {
      expect(getInitials("J D")).toBe("JD");
    });

    it("should handle name with numbers", () => {
      expect(getInitials("John123 Doe456")).toBe("JD");
    });

    it("should handle mixed case names", () => {
      expect(getInitials("JoHn DoE")).toBe("JD");
    });
  });

  describe("isNonEmptyString", () => {
    it("should return true for non-empty string", () => {
      expect(isNonEmptyString("hello")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isNonEmptyString("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(isNonEmptyString("   ")).toBe(false);
    });
  });

  describe("isNameValid", () => {
    it("should return true when both names are non-empty", () => {
      expect(isNameValid("John", "Doe")).toBe(true);
    });

    it("should return false when firstName is empty", () => {
      expect(isNameValid("", "Doe")).toBe(false);
    });

    it("should return false when lastName is empty", () => {
      expect(isNameValid("John", "")).toBe(false);
    });

    it("should return false for whitespace-only names", () => {
      expect(isNameValid("  ", "Doe")).toBe(false);
      expect(isNameValid("John", "  ")).toBe(false);
    });
  });

  describe("isBanReady", () => {
    it("should return true for future date", () => {
      expect(isBanReady(new Date(Date.now() + 86400000))).toBe(true);
    });

    it("should return false for past date", () => {
      expect(isBanReady(new Date(Date.now() - 86400000))).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBanReady(null)).toBe(false);
    });
  });

  describe("formatBanLabel", () => {
    it("should return formatted label when banUntil exists", () => {
      const date = new Date("2024-12-25T15:30:00");
      const result = formatBanLabel(date);
      expect(result).toContain("•");
      expect(result).not.toBe("Select date & time");
    });

    it("should return placeholder when banUntil is null", () => {
      expect(formatBanLabel(null)).toBe("Select date & time");
    });
  });
});
