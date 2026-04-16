import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { entityHelpers } from "./entity-helpers";

describe("[UNIT] entity-helpers", () => {
  describe("belongsTo", () => {
    it("returns true for matching IDs", () => {
      const entityId = "entity-123";
      const targetId = "entity-123";

      const result = entityHelpers.belongsTo(entityId, targetId);

      expect(result).toBe(true);
    });

    it("returns false for non-matching IDs", () => {
      const entityId = "entity-123";
      const targetId = "entity-456";

      const result = entityHelpers.belongsTo(entityId, targetId);

      expect(result).toBe(false);
    });

    it("returns false when IDs differ only in case", () => {
      const entityId = "Entity-123";
      const targetId = "entity-123";

      const result = entityHelpers.belongsTo(entityId, targetId);

      expect(result).toBe(false);
    });

    it("returns true for empty string IDs that match", () => {
      const entityId = "";
      const targetId = "";

      const result = entityHelpers.belongsTo(entityId, targetId);

      expect(result).toBe(true);
    });

    it("returns false when one ID is empty", () => {
      const entityId = "entity-123";
      const targetId = "";

      const result = entityHelpers.belongsTo(entityId, targetId);

      expect(result).toBe(false);
    });
  });

  describe("matchesComposite", () => {
    it("returns true for matching composite keys", () => {
      const ids = ["user-123", "trip-456"] as const;
      const targetIds = ["user-123", "trip-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(true);
    });

    it("returns false for non-matching composite keys", () => {
      const ids = ["user-123", "trip-456"] as const;
      const targetIds = ["user-123", "trip-789"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("returns false when first ID does not match", () => {
      const ids = ["user-123", "trip-456"] as const;
      const targetIds = ["user-789", "trip-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("returns false when arrays have different lengths", () => {
      const ids = ["user-123", "trip-456", "extra-id"] as const;
      const targetIds = ["user-123", "trip-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("returns false when target array is longer", () => {
      const ids = ["user-123"] as const;
      const targetIds = ["user-123", "trip-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("returns true for empty arrays", () => {
      const ids: readonly string[] = [];
      const targetIds: readonly string[] = [];

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(true);
    });

    it("returns true for single element arrays that match", () => {
      const ids = ["single-id"] as const;
      const targetIds = ["single-id"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(true);
    });

    it("returns false for single element arrays that do not match", () => {
      const ids = ["id-123"] as const;
      const targetIds = ["id-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("returns true for arrays with three matching elements", () => {
      const ids = ["user-123", "trip-456", "group-789"] as const;
      const targetIds = ["user-123", "trip-456", "group-789"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(true);
    });

    it("returns false when only middle element differs", () => {
      const ids = ["user-123", "trip-456", "group-789"] as const;
      const targetIds = ["user-123", "trip-999", "group-789"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });

    it("handles arrays with empty strings that match", () => {
      const ids = ["", ""] as const;
      const targetIds = ["", ""] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(true);
    });

    it("returns false when empty string positions differ", () => {
      const ids = ["user-123", ""] as const;
      const targetIds = ["user-123", "trip-456"] as const;

      const result = entityHelpers.matchesComposite(ids, targetIds);

      expect(result).toBe(false);
    });
  });

  describe("getAgeMs", () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it("calculates correct age for past date", () => {
      const mockNow = 1609459200000; // 2021-01-01T00:00:00Z
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 3600000); // 1 hour ago

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(3600000); // 1 hour in ms
    });

    it("returns 0 when createdAt is exactly now", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow);

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(0);
    });

    it("returns positive value for recent creation", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 1000); // 1 second ago

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(1000);
      expect(result).toBeGreaterThan(0);
    });

    it("calculates age for 24 hours correctly", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 86400000); // 24 hours ago

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(86400000);
    });

    it("calculates age for 7 days correctly", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const msIn7Days = 7 * 24 * 60 * 60 * 1000;
      const createdAt = new Date(mockNow - msIn7Days);

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(msIn7Days);
    });

    it("handles very old dates", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 31536000000); // 1 year ago

      const result = entityHelpers.getAgeMs(createdAt);

      expect(result).toBe(31536000000);
    });
  });

  describe("isExpired", () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it("returns true when age exceeds threshold", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 3600001); // 1 hour + 1ms ago
      const thresholdMs = 3600000; // 1 hour

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(true);
    });

    it("returns false when age is below threshold", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 1800000); // 30 minutes ago
      const thresholdMs = 3600000; // 1 hour

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });

    it("returns false when age exactly equals threshold", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 3600000); // exactly 1 hour ago
      const thresholdMs = 3600000; // 1 hour

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });

    it("returns false for entity created exactly now", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow);
      const thresholdMs = 1; // 1ms

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });

    it("returns true for zero threshold when age is positive", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 1); // 1ms ago
      const thresholdMs = 0;

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(true);
    });

    it("returns false for zero threshold when age is zero", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow);
      const thresholdMs = 0;

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });

    it("handles large thresholds correctly", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 604800000); // 7 days ago
      const thresholdMs = 2592000000; // 30 days

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });

    it("returns true when entity is much older than threshold", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      const createdAt = new Date(mockNow - 31536000000); // 1 year ago
      const thresholdMs = 86400000; // 24 hours

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(true);
    });

    it("handles 24 hour expiration correctly", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      // Entity created 24 hours and 1 second ago
      const createdAt = new Date(mockNow - 86401000);
      const thresholdMs = 86400000; // 24 hours

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(true);
    });

    it("handles 7 day expiration correctly", () => {
      const mockNow = 1609459200000;
      Date.now = () => mockNow;

      // Entity created exactly 7 days ago
      const msIn7Days = 7 * 24 * 60 * 60 * 1000;
      const createdAt = new Date(mockNow - msIn7Days);
      const thresholdMs = msIn7Days;

      const result = entityHelpers.isExpired(createdAt, thresholdMs);

      expect(result).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    it("combines belongsTo and matchesComposite for complex checks", () => {
      const entityUserId = "user-123";
      const entityTripId = "trip-456";
      const targetUserId = "user-123";
      const targetTripId = "trip-456";

      const isForUser = entityHelpers.belongsTo(entityUserId, targetUserId);
      const isForTrip = entityHelpers.belongsTo(entityTripId, targetTripId);
      const matchesComposite = entityHelpers.matchesComposite(
        [entityUserId, entityTripId],
        [targetUserId, targetTripId],
      );

      expect(isForUser).toBe(true);
      expect(isForTrip).toBe(true);
      expect(matchesComposite).toBe(true);
    });

    it("can check expiration for session-like entity", () => {
      const mockNow = 1609459200000;
      const originalDateNow = Date.now;
      Date.now = () => mockNow;

      // Session created 2 hours ago, expires after 24 hours
      const sessionCreatedAt = new Date(mockNow - 7200000);
      const sessionTimeoutMs = 86400000;

      const isSessionExpired = entityHelpers.isExpired(
        sessionCreatedAt,
        sessionTimeoutMs,
      );
      const sessionAge = entityHelpers.getAgeMs(sessionCreatedAt);

      Date.now = originalDateNow;

      expect(isSessionExpired).toBe(false);
      expect(sessionAge).toBe(7200000);
      expect(sessionAge).toBeLessThan(sessionTimeoutMs);
    });
  });
});
