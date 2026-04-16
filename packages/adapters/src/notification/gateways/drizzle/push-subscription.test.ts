import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzlePushSubscriptionGateway } from "./push-subscription";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { PushSubscriptionDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzlePushSubscriptionGateway
 *
 * Tests the gateway methods for push subscription management:
 * - deleteByUserId() - Delete all subscriptions for a user
 * - hasSubscriptions() - Check if user has subscriptions
 * - countByUserId() - Count subscriptions for user
 * - findByUserIdConnection() - Cursor pagination for user subscriptions
 * - findByPlatformConnection() - Cursor pagination by platform
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockSubscriptionDTO(
  overrides: Partial<PushSubscriptionDTO> = {},
): PushSubscriptionDTO {
  return {
    id: "sub-123",
    userId: "user-456",
    endpoint: "https://example.com/push",
    p256dh: "test-p256dh",
    auth: "test-auth",
    platform: "ios",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ count }]),
        limit: () => Promise.resolve([{ count }]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          // Return a thenable that rejects for await support
          const rejectingThenable = {
            orderBy: () => Promise.reject(new Error(errorMessage)),
            limit: () => Promise.reject(new Error(errorMessage)),
            then: (
              _onFulfilled?: unknown,
              onRejected?: (reason: unknown) => unknown,
            ) => {
              const error = new Error(errorMessage);
              return onRejected ? onRejected(error) : Promise.reject(error);
            },
          };
          return rejectingThenable;
        },
        orderBy: () => Promise.reject(new Error(errorMessage)),
        limit: () => Promise.reject(new Error(errorMessage)),
      }),
    }),
    delete: () => ({
      where: () => Promise.reject(new Error(errorMessage)),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzlePushSubscriptionGateway", () => {
  // ==========================================================================
  // deleteByUserId() Method Tests
  // ==========================================================================

  describe("deleteByUserId()", () => {
    it("deletes all subscriptions for a user", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.deleteByUserId("user-456"),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.deleteByUserId("user-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("deleteByUserId");
      }
    });
  });

  // ==========================================================================
  // hasSubscriptions() Method Tests
  // ==========================================================================

  describe("hasSubscriptions()", () => {
    it("returns true when user has subscriptions", async () => {
      const mockDb = createCountMockDb(3);
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasSubscriptions("user-456"),
      );

      expect(result).toBe(true);
    });

    it("returns false when user has no subscriptions", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasSubscriptions("user-456"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.hasSubscriptions("user-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("hasSubscriptions");
      }
    });
  });

  // ==========================================================================
  // countByUserId() Method Tests
  // ==========================================================================

  describe("countByUserId()", () => {
    it("returns subscription count for user", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByUserId("user-456"));

      expect(result).toBe(5);
    });

    it("returns 0 when no subscriptions exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByUserId("user-456"));

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzlePushSubscriptionGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countByUserId("user-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countByUserId");
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - deleteByUserId: User subscription deletion, error handling
// - hasSubscriptions: Boolean check for subscription existence, error handling
// - countByUserId: Exact count retrieval, zero handling, error handling
//
// All tests use Effect.either for comprehensive error testing with DatabaseError.
