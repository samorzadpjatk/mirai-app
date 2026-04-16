import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleNotificationDeliveryGateway } from "./delivery";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { DeliveryStats, DeliveryFilters } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleNotificationDeliveryGateway
 *
 * Tests the gateway methods for notification delivery management:
 * - count() - Count deliveries with filters
 * - getStats() - Complex SQL aggregation for delivery statistics
 * - countFailed() - Count failed deliveries for a trip
 * - findByNotificationId() / findMany() / findFailed() - Not implemented methods
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Create a mock database response for stats aggregation
 *
 * Uses 'in' operator to properly handle null values as valid overrides
 * (null ?? 100 returns 100, but "prop" in obj ? obj.prop : 100 preserves null)
 */
function createMockStatsResult(
  overrides: {
    totalCount?: number;
    totalRecipients?: number | null;
    totalSuccess?: number | null;
    totalFailures?: number | null;
    avgSuccess?: number | null;
    avgFailures?: number | null;
  } = {},
): Array<{
  totalCount: number;
  totalRecipients: number | null;
  totalSuccess: number | null;
  totalFailures: number | null;
  avgSuccess: number | null;
  avgFailures: number | null;
}> {
  return [
    {
      totalCount: overrides.totalCount ?? 100,
      totalRecipients:
        "totalRecipients" in overrides
          ? (overrides.totalRecipients ?? null)
          : 100,
      totalSuccess:
        "totalSuccess" in overrides ? (overrides.totalSuccess ?? null) : 80,
      totalFailures:
        "totalFailures" in overrides ? (overrides.totalFailures ?? null) : 20,
      avgSuccess:
        "avgSuccess" in overrides ? (overrides.avgSuccess ?? null) : 0.8,
      avgFailures:
        "avgFailures" in overrides ? (overrides.avgFailures ?? null) : 0.2,
    },
  ];
}

/**
 * Create a mock status breakdown response
 */
function createMockStatusBreakdown(
  statuses: Record<string, number>,
): Array<{ status: string; count: number }> {
  return Object.entries(statuses).map(([status, count]) => ({
    status,
    count,
  }));
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

/**
 * Create a mock DrizzleDb for count queries
 */
function createCountMockDb(count: number): DrizzleDb {
  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count }]),
        }),
      }),
    }),
  };
  return mockDb as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for getStats with provided results
 *
 * The getStats method makes two queries:
 * 1. Aggregate stats query: db.select({ aggregates }).from().where().limit(1)
 * 2. Status breakdown query: db.select({ status, count }).from().where().groupBy(status)
 *
 * We need to track call count to return the correct response for each query.
 */
function createStatsMockDb(
  stats: Array<{
    totalCount: number;
    totalRecipients: number | null;
    totalSuccess: number | null;
    totalFailures: number | null;
    avgSuccess: number | null;
    avgFailures: number | null;
  }>,
  statusBreakdown: Array<{ status: string; count: number }>,
): DrizzleDb {
  let callCount = 0;

  return {
    select: () => {
      callCount++;
      const isSecondQuery = callCount === 2;

      return {
        from: () => ({
          where: () => {
            if (isSecondQuery) {
              // Second query uses groupBy() which directly returns a promise
              // No limit() is called after groupBy in the real code
              return {
                groupBy: () => Promise.resolve(statusBreakdown),
              };
            }
            // First query uses limit() directly
            return {
              limit: () => Promise.resolve(stats),
            };
          },
        }),
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb that always fails
 */
function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error(errorMessage)),
          groupBy: () => ({
            limit: () => Promise.reject(new Error(errorMessage)),
          }),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleNotificationDeliveryGateway", () => {
  // ==========================================================================
  // count() Method Tests
  // ==========================================================================

  describe("count()", () => {
    it("counts all deliveries without filters", async () => {
      const mockDb = createCountMockDb(100);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.count());

      expect(result).toBe(100);
    });

    it("returns 0 when no deliveries exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.count());

      expect(result).toBe(0);
    });

    it("counts with status filter", async () => {
      const mockDb = createCountMockDb(50);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({ status: "success" }),
      );

      expect(result).toBe(50);
    });

    it("counts with tripId filter", async () => {
      const mockDb = createCountMockDb(25);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({ tripId: "trip-123" }),
      );

      expect(result).toBe(25);
    });

    it("counts with scheduleId filter", async () => {
      const mockDb = createCountMockDb(10);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({ scheduleId: "schedule-456" }),
      );

      expect(result).toBe(10);
    });

    it("counts with date range filter", async () => {
      const mockDb = createCountMockDb(30);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        }),
      );

      expect(result).toBe(30);
    });

    it("counts with combined filters", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({
          tripId: "trip-123",
          status: "failure",
          scheduleId: "schedule-456",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        }),
      );

      expect(result).toBe(5);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.count()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("count");
      }
    });
  });

  // ==========================================================================
  // getStats() Method Tests (HIGHEST PRIORITY)
  // ==========================================================================

  describe("getStats()", () => {
    it("returns stats with no filters (full dataset)", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 100,
        totalRecipients: 100,
        totalSuccess: 80,
        totalFailures: 20,
        avgSuccess: 0.8,
        avgFailures: 0.2,
      });
      const mockBreakdown = createMockStatusBreakdown({
        pending: 10,
        success: 80,
        partial_failure: 5,
        failure: 5,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.totalDeliveries).toBe(100);
      expect(result.totalRecipients).toBe(100);
      expect(result.totalSuccess).toBe(80);
      expect(result.totalFailures).toBe(20);
    });

    it("returns stats with tripId filter", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 50,
        totalRecipients: 50,
        totalSuccess: 40,
        totalFailures: 10,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 40,
        failure: 10,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getStats({ tripId: "trip-123" }),
      );

      expect(result.totalDeliveries).toBe(50);
      expect(result.totalSuccess).toBe(40);
    });

    it("returns stats with status filter", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 80,
        totalRecipients: 80,
        totalSuccess: 80,
        totalFailures: 0,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 80,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getStats({ status: "success" }),
      );

      expect(result.totalDeliveries).toBe(80);
      expect(result.totalSuccess).toBe(80);
    });

    it("returns stats with date range filter", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 30,
        totalRecipients: 30,
        totalSuccess: 25,
        totalFailures: 5,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 25,
        failure: 5,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getStats({
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        }),
      );

      expect(result.totalDeliveries).toBe(30);
    });

    it("calculates 0% success rate correctly", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 10,
        totalRecipients: 100,
        totalSuccess: 0,
        totalFailures: 100,
      });
      const mockBreakdown = createMockStatusBreakdown({
        failure: 10,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.successRate).toBe(0);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailures).toBe(100);
    });

    it("calculates 50% success rate correctly", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 20,
        totalRecipients: 100,
        totalSuccess: 50,
        totalFailures: 50,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 10,
        failure: 10,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.successRate).toBe(50);
    });

    it("calculates 100% success rate correctly", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 10,
        totalRecipients: 100,
        totalSuccess: 100,
        totalFailures: 0,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 10,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.successRate).toBe(100);
      expect(result.totalSuccess).toBe(100);
    });

    it("handles null aggregated values by converting to 0", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 0,
        totalRecipients: null,
        totalSuccess: null,
        totalFailures: null,
        avgSuccess: null,
        avgFailures: null,
      });
      const mockBreakdown: Array<{ status: string; count: number }> = [];

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.totalDeliveries).toBe(0);
      expect(result.totalRecipients).toBe(0);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailures).toBe(0);
      expect(result.avgSuccessPerDelivery).toBe(0);
      expect(result.avgFailuresPerDelivery).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it("returns 0 for all values when no deliveries exist", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 0,
        totalRecipients: 0,
        totalSuccess: 0,
        totalFailures: 0,
        avgSuccess: 0,
        avgFailures: 0,
      });
      const mockBreakdown: Array<{ status: string; count: number }> = [];

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.totalDeliveries).toBe(0);
      expect(result.totalRecipients).toBe(0);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailures).toBe(0);
      expect(result.avgSuccessPerDelivery).toBe(0);
      expect(result.avgFailuresPerDelivery).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.statusBreakdown).toEqual({});
    });

    it("includes all statuses in status breakdown", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 200,
        totalRecipients: 200,
        totalSuccess: 150,
        totalFailures: 50,
      });
      const mockBreakdown = createMockStatusBreakdown({
        pending: 25,
        success: 150,
        partial_failure: 15,
        failure: 10,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.statusBreakdown.pending).toBe(25);
      expect(result.statusBreakdown.success).toBe(150);
      expect(result.statusBreakdown.partial_failure).toBe(15);
      expect(result.statusBreakdown.failure).toBe(10);
    });

    it("returns correct average calculations", async () => {
      const mockStats = createMockStatsResult({
        totalCount: 10,
        totalRecipients: 100,
        totalSuccess: 80,
        totalFailures: 20,
        avgSuccess: 8.0,
        avgFailures: 2.0,
      });
      const mockBreakdown = createMockStatusBreakdown({
        success: 8,
        failure: 2,
      });

      const mockDb = createStatsMockDb(mockStats, mockBreakdown);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.getStats());

      expect(result.avgSuccessPerDelivery).toBe(8.0);
      expect(result.avgFailuresPerDelivery).toBe(2.0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.getStats()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("getStats");
      }
    });
  });

  // ==========================================================================
  // countFailed() Method Tests
  // ==========================================================================

  describe("countFailed()", () => {
    it("counts deliveries with failure status", async () => {
      const mockDb = createCountMockDb(10);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.countFailed("trip-123"));

      expect(result).toBe(10);
    });

    it("counts deliveries with partial_failure status", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.countFailed("trip-123"));

      expect(result).toBe(5);
    });

    it("counts both failure and partial_failure together", async () => {
      const mockDb = createCountMockDb(15);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(gateway.countFailed("trip-123"));

      expect(result).toBe(15);
    });

    it("returns 0 when no failures exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countFailed("trip-no-failures"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countFailed("trip-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countFailed");
      }
    });
  });

  // ==========================================================================
  // Not Implemented Methods Tests
  // ==========================================================================

  describe("Not Implemented Methods", () => {
    describe("findByNotificationId()", () => {
      it("returns DatabaseError with 'Not implemented' message", async () => {
        const mockDb = createCountMockDb(0);
        const gateway = new DrizzleNotificationDeliveryGateway(mockDb);

        const either = await Effect.runPromise(
          Effect.either(gateway.findByNotificationId("notification-123")),
        );

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(DatabaseError);
          expect(either.left.operation).toBe("findByNotificationId");
          expect(either.left.message).toBe("Not implemented");
        }
      });
    });

    describe("findMany()", () => {
      it("returns DatabaseError with 'Not implemented' message", async () => {
        const mockDb = createCountMockDb(0);
        const gateway = new DrizzleNotificationDeliveryGateway(mockDb);
        const filters: DeliveryFilters = { tripId: "trip-123" };
        const pagination = { limit: 10, offset: 0 };

        const either = await Effect.runPromise(
          Effect.either(gateway.findMany(filters, pagination)),
        );

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(DatabaseError);
          expect(either.left.operation).toBe("findMany");
          expect(either.left.message).toBe("Not implemented");
        }
      });
    });

    describe("findFailed()", () => {
      it("returns DatabaseError with 'Not implemented' message", async () => {
        const mockDb = createCountMockDb(0);
        const gateway = new DrizzleNotificationDeliveryGateway(mockDb);
        const pagination = { limit: 10, offset: 0 };

        const either = await Effect.runPromise(
          Effect.either(gateway.findFailed("trip-123", pagination)),
        );

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(DatabaseError);
          expect(either.left.operation).toBe("findFailed");
          expect(either.left.message).toBe("Not implemented");
        }
      });
    });
  });
});
