import { describe, it, expect } from "bun:test";
import { entityHelpers } from "./entity-helpers";

describe("[UNIT] entity-helpers", () => {
  describe("[UNIT] belongsTo", () => {
    it("returns true when IDs match", () => {
      const result = entityHelpers.belongsTo("trip-123", "trip-123");

      expect(result).toBe(true);
    });

    it("returns false when IDs don't match", () => {
      const result = entityHelpers.belongsTo("trip-123", "trip-456");

      expect(result).toBe(false);
    });

    it("is case-sensitive", () => {
      const result = entityHelpers.belongsTo("Trip-123", "trip-123");

      expect(result).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(entityHelpers.belongsTo("", "")).toBe(true); // Empty equals empty
      expect(entityHelpers.belongsTo("id", "")).toBe(false);
      expect(entityHelpers.belongsTo("", "id")).toBe(false);
    });
  });

  describe("[UNIT] matchesComposite", () => {
    it("returns true when all IDs match", () => {
      const result = entityHelpers.matchesComposite(
        ["user-123", "trip-456"],
        ["user-123", "trip-456"],
      );

      expect(result).toBe(true);
    });

    it("returns false when any ID doesn't match", () => {
      const result = entityHelpers.matchesComposite(
        ["user-123", "trip-456"],
        ["user-123", "trip-999"],
      );

      expect(result).toBe(false);
    });

    it("returns false when arrays have different lengths", () => {
      expect(
        entityHelpers.matchesComposite(["user-123"], ["user-123", "trip-456"]),
      ).toBe(false);

      expect(
        entityHelpers.matchesComposite(["user-123", "trip-456"], ["user-123"]),
      ).toBe(false);
    });

    it("returns true for empty arrays", () => {
      const result = entityHelpers.matchesComposite([], []);

      expect(result).toBe(true);
    });

    it("returns true for single element match", () => {
      const result = entityHelpers.matchesComposite(["user-123"], ["user-123"]);

      expect(result).toBe(true);
    });

    it("handles three or more IDs", () => {
      const result = entityHelpers.matchesComposite(
        ["a", "b", "c", "d"],
        ["a", "b", "c", "d"],
      );

      expect(result).toBe(true);
    });
  });

  describe("[UNIT] getAgeMs", () => {
    it("returns positive value for past dates", () => {
      const past = new Date(Date.now() - 1000); // 1 second ago
      const result = entityHelpers.getAgeMs(past);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(2000); // Within 2 seconds
    });

    it("returns approximately correct values", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = entityHelpers.getAgeMs(oneHourAgo);

      expect(result).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000); // ~1 hour minus tolerance
      expect(result).toBeLessThanOrEqual(60 * 60 * 1000 + 1000); // ~1 hour plus tolerance
    });

    it("returns zero for current date", () => {
      const now = new Date();
      const result = entityHelpers.getAgeMs(now);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10); // Very small tolerance
    });

    it("returns negative for future dates (edge case)", () => {
      const future = new Date(Date.now() + 1000);
      const result = entityHelpers.getAgeMs(future);

      expect(result).toBeLessThan(0);
    });
  });

  describe("[UNIT] isExpired", () => {
    it("returns true when age exceeds threshold", () => {
      const old = new Date(Date.now() - 2000); // 2 seconds ago
      const result = entityHelpers.isExpired(old, 1000); // 1 second threshold

      expect(result).toBe(true);
    });

    it("returns false when age is below threshold", () => {
      const recent = new Date(Date.now() - 500); // 0.5 seconds ago
      const result = entityHelpers.isExpired(recent, 1000); // 1 second threshold

      expect(result).toBe(false);
    });

    it("returns false at exact boundary", () => {
      const threshold = 1000;
      const exactlyAtThreshold = new Date(Date.now() - threshold);
      const result = entityHelpers.isExpired(exactlyAtThreshold, threshold);

      expect(result).toBe(false); // Not strictly greater than
    });

    it("works with common thresholds", () => {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const oneWeekMs = 7 * oneDayMs;

      // Entity created 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * oneDayMs);

      expect(entityHelpers.isExpired(twoDaysAgo, oneDayMs)).toBe(true); // Expired after 1 day
      expect(entityHelpers.isExpired(twoDaysAgo, oneWeekMs)).toBe(false); // Not expired after 7 days
    });

    it("returns false for current date", () => {
      const now = new Date();
      const result = entityHelpers.isExpired(now, 1000);

      expect(result).toBe(false);
    });
  });
});
