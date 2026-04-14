import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Layer, Context } from "effect";
import { DrizzleTripPointsCalculator } from "../trip-points";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { runWithTestLayer, createServiceLayer } from "../../test/test-helpers";

// =============================================================================
// Context Tag for DrizzleDb dependency injection
// =============================================================================

const DrizzleDbTag = Context.Tag<DrizzleDb>("DrizzleDb");

// =============================================================================
// Test Setup
// =============================================================================

describe("[UNIT] DrizzleTripPointsCalculator", () => {
  let mockDb: DrizzleDb;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve([])),
        })),
      })),
    } as unknown as DrizzleDb;
  });

  // =============================================================================
  // Helper to create service with mocked DB using Layer pattern
  // =============================================================================

  const createServiceWithMock = (db: DrizzleDb) => {
    return new DrizzleTripPointsCalculator(db);
  };

  describe("[UNIT] calculateTotalAvailablePoints", () => {
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

      // Create a properly mocked query builder
      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve(mockChallenges)),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);

      // Run the effect using Layer-based pattern
      const TestLayer = createServiceLayer(DrizzleDbTag, testMockDb);

      const result = await runWithTestLayer(
        service.calculateTotalAvailablePoints("trip-123"),
        TestLayer,
      );

      expect(result).toBe(450); // 100 + 200 + 150
    });

    it("should return Effect that can be run", async () => {
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);
      const service = createServiceWithMock(mockDb);

      const effect = service.calculateTotalAvailablePoints("trip-123");

      // Verify it returns an Effect
      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");

      // Verify it can be run with Layer
      const result = await runWithTestLayer(effect, TestLayer);
      expect(typeof result).toBe("number");
    });

    it("should calculate points for UNLIMITED scoring category", async () => {
      const mockChallenges = [
        {
          basePoints: 50,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          scoringCategory: "UNLIMITED",
        },
        {
          basePoints: 100,
          firstPlacePoints: 10,
          secondPlacePoints: 5,
          thirdPlacePoints: 2,
          scoringCategory: "STANDARD",
        },
      ];

      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve(mockChallenges)),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, testMockDb);

      const result = await runWithTestLayer(
        service.calculateTotalAvailablePoints("trip-456"),
        TestLayer,
      );

      // UNLIMITED only adds basePoints: 50 + (100 + 10 + 5 + 2) = 167
      expect(result).toBe(167);
    });

    it("should handle empty challenges list", async () => {
      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve([])),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, testMockDb);

      const result = await runWithTestLayer(
        service.calculateTotalAvailablePoints("trip-empty"),
        TestLayer,
      );

      expect(result).toBe(0);
    });

    it("should handle challenges with bonus points", async () => {
      const mockChallenges = [
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "STANDARD",
        },
      ];

      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve(mockChallenges)),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, testMockDb);

      const result = await runWithTestLayer(
        service.calculateTotalAvailablePoints("trip-bonus"),
        TestLayer,
      );

      // 100 + 50 + 30 + 20 = 200
      expect(result).toBe(200);
    });
  });

  describe("[UNIT] Layer-based DI patterns", () => {
    it("should work with merged layers", async () => {
      const mockChallenges = [{ basePoints: 100, scoringCategory: "STANDARD" }];

      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve(mockChallenges)),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);

      // Create layer using Layer.succeed
      const TestLayer = Layer.succeed(DrizzleDbTag, testMockDb);

      const result = await Effect.runPromise(
        service
          .calculateTotalAvailablePoints("trip-123")
          .pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBe(100);
    });

    it("should demonstrate Effect.provide pattern", async () => {
      const mockQueryBuilder = {
        select: mock(() => mockQueryBuilder),
        from: mock(() => mockQueryBuilder),
        where: mock(() => Promise.resolve([])),
      };

      const testMockDb = {
        select: mockQueryBuilder.select,
      } as unknown as DrizzleDb;

      const service = createServiceWithMock(testMockDb);

      // Direct Effect.provide usage
      const program = Effect.gen(function* () {
        const points = yield* service.calculateTotalAvailablePoints("trip-789");
        return points;
      }).pipe(Effect.provide(Layer.succeed(DrizzleDbTag, testMockDb)));

      const result = await Effect.runPromise(program);
      expect(result).toBe(0);
    });
  });
});
