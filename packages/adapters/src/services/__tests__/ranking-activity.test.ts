import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  DrizzleRankingActivityService,
  type RankSnapshot,
} from "../ranking-activity";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

// Mock the drizzle database
describe("[UNIT] DrizzleRankingActivityService", () => {
  let service: DrizzleRankingActivityService;

  beforeEach(() => {
    service = new DrizzleRankingActivityService({} as DrizzleDb);
  });

  describe("captureTripRankingSnapshot", () => {
    it("should return Effect that can be run", () => {
      const effect = service.captureTripRankingSnapshot(
        {} as DrizzleDb,
        "trip-123",
      );

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should handle empty snapshot", async () => {
      // Test with empty snapshot (no groups)
      const previousSnapshot: RankSnapshot = new Map();

      const effect = service.createRankChangeActivities({
        tx: {} as DrizzleDb,
        tripId: "trip-123",
        previousSnapshot,
      });

      // Should complete without error for empty snapshot
      await expect(Effect.runPromise(effect)).resolves.toBeUndefined();
    });
  });

  describe("createRankChangeActivities", () => {
    it("should return Effect that can be run", () => {
      const previousSnapshot: RankSnapshot = new Map();
      const effect = service.createRankChangeActivities({
        tx: {} as DrizzleDb,
        tripId: "trip-123",
        previousSnapshot,
      });

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });
});
