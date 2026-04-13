import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleTripPointsCalculator } from "../trip-points";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

// Mock the drizzle module
const mockDb = {
  select: mock(() => ({
    from: mock(() => ({
      where: mock(() => Promise.resolve([])),
    })),
  })),
} as unknown as DrizzleDb;

describe("[UNIT] DrizzleTripPointsCalculator", () => {
  let service: DrizzleTripPointsCalculator;

  beforeEach(() => {
    service = new DrizzleTripPointsCalculator(mockDb);
  });

  describe("calculateTotalAvailablePoints", () => {
    it("should calculate total points from challenges", async () => {
      // Mock the db to return challenges
      const mockChallenges = [
        {
          basePoints: 100,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          scoringCategory: "STANDARD",
        },
        {
          basePoints: 200,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          scoringCategory: "STANDARD",
        },
        {
          basePoints: 150,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          scoringCategory: "STANDARD",
        },
      ];

      // Need to properly mock the Drizzle query builder
      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve(mockChallenges)),
      };

      const mockService = new DrizzleTripPointsCalculator({
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb);

      // Run the effect
      const result = await Effect.runPromise(
        mockService.calculateTotalAvailablePoints("trip-123"),
      );

      expect(result).toBe(450); // 100 + 200 + 150
    });

    it("should return Effect that can be run", async () => {
      const effect = service.calculateTotalAvailablePoints("trip-123");

      // Verify it returns an Effect
      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });
});
