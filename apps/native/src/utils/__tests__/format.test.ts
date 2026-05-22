import { describe, it, expect } from "@jest/globals";
import { formatDate, formatCurrency, formatRelativeTime } from "../format";

describe("Format Utilities", () => {
  describe("formatDate", () => {
    it("should format Date object", () => {
      const date = new Date(2024, 2, 15, 10, 30, 0);
      const result = formatDate(date);
      expect(result).toContain("2024");
      expect(result).toContain("15");
    });

    it("should format date string", () => {
      const result = formatDate("2024-03-15T10:30:00");
      expect(result).toContain("2024");
    });

    it("should return Unknown date for invalid string", () => {
      expect(formatDate("invalid")).toBe("Unknown date");
    });

    it("should return Unknown date for NaN Date", () => {
      expect(formatDate(new Date(NaN))).toBe("Unknown date");
    });
  });

  describe("formatCurrency", () => {
    it("should format PLN currency", () => {
      expect(formatCurrency(100)).toContain("100");
      expect(formatCurrency(100)).toContain("zł");
    });

    it("should format decimal amounts", () => {
      expect(formatCurrency(99.99)).toContain("99");
    });

    it("should format zero", () => {
      expect(formatCurrency(0)).toContain("0");
    });
  });

  describe("formatRelativeTime", () => {
    it("should return 'just now' for recent time", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("just now");
    });

    it("should return minutes ago", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
    });

    it("should return single minute ago", () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe("1 minute ago");
    });

    it("should return hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe("2 hours ago");
    });

    it("should return single hour ago", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");
    });

    it("should return days ago", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoDaysAgo)).toBe("2 days ago");
    });

    it("should return single day ago", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe("1 day ago");
    });

    it("should return date string for old dates", () => {
      const oldDate = new Date("2020-01-01");
      const result = formatRelativeTime(oldDate);
      expect(result).toContain("2020");
    });

    it("should handle string input", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
    });
  });
});
