import { describe, it, expect } from "@jest/globals";
import { formatDate, getInitials } from "../validation";

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
});
