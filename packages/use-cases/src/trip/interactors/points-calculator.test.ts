import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { TripPointsCalculator } from "./points-calculator";
import { UseCaseError } from "../../system/errors";

type ScoringCategory = "UNLIMITED" | "LIMITED" | "EXPLORATION" | "PHOTO";

/**
 * Mock DrizzleDb for testing
 */
function createMockDrizzleDb(
  options: {
    challenges?: Array<{
      basePoints: number | null;
      firstPlacePoints: number | null;
      secondPlacePoints: number | null;
      thirdPlacePoints: number | null;
      scoringCategory: ScoringCategory;
    }>;
    shouldFailSelect?: boolean;
  } = {},
) {
  return {
    select: (_fields: Record<string, unknown>) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => {
          if (options.shouldFailSelect) {
            throw new Error("Database query failed");
          }
          return Promise.resolve(options.challenges ?? []);
        },
      }),
    }),
  } as unknown as DrizzleDb;
}

describe("[UNIT] TripPointsCalculator", () => {
  it("should calculate total points from all challenges", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "EXPLORATION" as ScoringCategory,
        },
        {
          basePoints: 75,
          firstPlacePoints: 40,
          secondPlacePoints: 25,
          thirdPlacePoints: 15,
          scoringCategory: "PHOTO" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // Challenge 1: 100 + 50 + 30 + 20 = 200
    // Challenge 2: 75 + 40 + 25 + 15 = 155
    // Total: 355
    expect(result).toBe(355);
  });

  it("should calculate points for UNLIMITED category (no place points)", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "UNLIMITED" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // UNLIMITED: only basePoints (100)
    expect(result).toBe(100);
  });

  it("should return 0 when trip has no challenges", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-empty"),
    );

    expect(result).toBe(0);
  });

  it("should handle null point values by treating them as 0", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 100,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          scoringCategory: "EXPLORATION" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // Only basePoints: 100 + 0 + 0 + 0 = 100
    expect(result).toBe(100);
  });

  it("should handle mixed null and number values correctly", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: null,
          thirdPlacePoints: 10,
          scoringCategory: "EXPLORATION" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // 100 + 50 + 0 + 10 = 160
    expect(result).toBe(160);
  });

  it("should handle challenges with 0 base points", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 0,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "EXPLORATION" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // 0 + 50 + 30 + 20 = 100
    expect(result).toBe(100);
  });

  it("should fail with UseCaseError on database error", async () => {
    const mockDb = createMockDrizzleDb({
      shouldFailSelect: true,
    });
    const calculator = new TripPointsCalculator(mockDb);

    const either = await Effect.runPromise(
      Effect.either(calculator.calculateTotalAvailablePoints("trip-123")),
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UseCaseError);
      if (either.left instanceof UseCaseError) {
        expect(either.left.operation).toBe("calculateTotalAvailablePoints");
        expect(either.left.message).toContain(
          "Failed to calculate total available points for trip trip-123",
        );
      }
    }
  });

  it("should sum points correctly across multiple scoring categories", async () => {
    const mockDb = createMockDrizzleDb({
      challenges: [
        {
          basePoints: 50,
          firstPlacePoints: 0,
          secondPlacePoints: 0,
          thirdPlacePoints: 0,
          scoringCategory: "UNLIMITED" as ScoringCategory,
        },
        {
          basePoints: 30,
          firstPlacePoints: 20,
          secondPlacePoints: 10,
          thirdPlacePoints: 5,
          scoringCategory: "LIMITED" as ScoringCategory,
        },
        {
          basePoints: 40,
          firstPlacePoints: 25,
          secondPlacePoints: 15,
          thirdPlacePoints: 10,
          scoringCategory: "EXPLORATION" as ScoringCategory,
        },
      ],
    });
    const calculator = new TripPointsCalculator(mockDb);

    const result = await Effect.runPromise(
      calculator.calculateTotalAvailablePoints("trip-123"),
    );

    // UNLIMITED: 50
    // LIMITED: 30 + 20 + 10 + 5 = 65
    // EXPLORATION: 40 + 25 + 15 + 10 = 90
    // Total: 205
    expect(result).toBe(205);
  });
});
