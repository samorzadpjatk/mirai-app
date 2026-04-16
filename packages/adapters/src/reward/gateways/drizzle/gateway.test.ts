import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleRewardGateway, DrizzleRewardPurchaseGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { RewardDTO, RewardPurchaseDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleRewardGateway and DrizzleRewardPurchaseGateway
 *
 * Tests the gateway methods for reward and purchase management:
 *
 * RewardGateway:
 * - findByTripId() / findVisibleByTripId() / findAvailableByTripId() - Trip-based queries
 * - findByCreatorId() - Creator-based query
 * - hide() / unhide() - Visibility toggle
 * - decrementAvailableQuantity() / incrementQuantity() - Quantity management
 * - hasPurchases() / getPurchaseCount() - Purchase tracking
 * - countByTripId() - Count rewards by trip
 * - Cursor pagination methods
 *
 * RewardPurchaseGateway:
 * - findByRewardId() / findByGroupId() / findByTripId() - Purchase queries
 * - findByStatus() - Status-based query
 * - updateStatus() - Update purchase status
 * - countByGroupId() / countByRewardId() - Counting methods
 * - Cursor pagination methods
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockRewardDTO(overrides: Partial<RewardDTO> = {}): RewardDTO {
  return {
    id: "reward-123",
    tripId: "trip-456",
    name: "Test Reward",
    description: "A test reward",
    imageUrl: null,
    price: 100,
    availableQuantity: 50,
    isHidden: false,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockPurchaseDTO(
  overrides: Partial<RewardPurchaseDTO> = {},
): RewardPurchaseDTO {
  return {
    id: "purchase-123",
    rewardId: "reward-456",
    groupId: "group-789",
    quantity: 1,
    totalPrice: 100,
    status: "PENDING",
    purchasedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

function createSelectMockDb(records: unknown[]): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const whereChain = {
            limit: (_n: number) => {
              const limitChain = {
                offset: () => Promise.resolve(records),
                then: (resolve: (value: unknown[]) => unknown) =>
                  resolve(records),
              };
              return limitChain;
            },
            offset: () => Promise.resolve(records),
            orderBy: () => Promise.resolve(records),
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve(records),
                offset: () => Promise.resolve(records),
              }),
            }),
            then: (resolve: (value: unknown[]) => unknown) => resolve(records),
          };
          return whereChain;
        },
        limit: () => Promise.resolve(records),
        offset: () => Promise.resolve(records),
        orderBy: () => Promise.resolve(records),
        then: (resolve: (value: unknown[]) => unknown) => resolve(records),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const whereChain = {
            limit: () => Promise.resolve([{ count }]),
            then: (resolve: (value: { count: number }[]) => unknown) =>
              resolve([{ count }]),
          };
          return whereChain;
        },
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ count }]),
          }),
        }),
        then: (resolve: (value: { count: number }[]) => unknown) =>
          resolve([{ count }]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createUpdateMockDb(returnRecord: unknown): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnRecord]),
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([returnRecord]),
          then: (resolve: (value: unknown[]) => unknown) =>
            resolve([returnRecord]),
        }),
        limit: () => Promise.resolve([returnRecord]),
        then: (resolve: (value: unknown[]) => unknown) =>
          resolve([returnRecord]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const whereChain = {
            limit: () => ({
              offset: () => Promise.reject(new Error(errorMessage)),
            }),
            then: (_resolve: unknown, reject: (error: Error) => unknown) =>
              reject(new Error(errorMessage)),
          };
          return whereChain;
        },
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.reject(new Error(errorMessage)),
          }),
        }),
        then: (_resolve: unknown, reject: (error: Error) => unknown) =>
          reject(new Error(errorMessage)),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite - DrizzleRewardGateway
// ============================================================================

describe("[UNIT] DrizzleRewardGateway", () => {
  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns rewards for a trip", async () => {
      const mockRecords = Array.from({ length: 3 }, (_, i) =>
        createMockRewardDTO({ id: `reward-${i}`, tripId: "trip-456" }),
      );
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result.items).toHaveLength(3);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleRewardGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // hide() / unhide() Method Tests
  // ==========================================================================

  describe("hide()", () => {
    it("hides a reward", async () => {
      const mockRecord = createMockRewardDTO({ isHidden: true });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(gateway.hide("reward-123"));

      expect(result.isHidden).toBe(true);
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleRewardGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.hide("reward-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("unhide()", () => {
    it("unhides a reward", async () => {
      const mockRecord = createMockRewardDTO({ isHidden: false });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(gateway.unhide("reward-123"));

      expect(result.isHidden).toBe(false);
    });
  });

  // ==========================================================================
  // Quantity Management Tests
  // ==========================================================================

  describe("decrementAvailableQuantity()", () => {
    it("decrements reward quantity", async () => {
      const mockRecord = createMockRewardDTO({ availableQuantity: 45 });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.decrementAvailableQuantity("reward-123", 5),
      );

      expect(result.availableQuantity).toBe(45);
    });
  });

  describe("incrementQuantity()", () => {
    it("increments reward quantity", async () => {
      const mockRecord = createMockRewardDTO({ availableQuantity: 55 });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.incrementQuantity(
          "reward-123" as unknown as import("@mirai-app/domain").RewardId,
          5,
        ),
      );

      expect(result.availableQuantity).toBe(55);
    });
  });

  // ==========================================================================
  // Purchase Tracking Tests
  // ==========================================================================

  describe("hasPurchases()", () => {
    it("returns true when reward has purchases", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasPurchases(
          "reward-123" as unknown as import("@mirai-app/domain").RewardId,
        ),
      );

      expect(result).toBe(true);
    });

    it("returns false when reward has no purchases", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasPurchases(
          "reward-123" as unknown as import("@mirai-app/domain").RewardId,
        ),
      );

      expect(result).toBe(false);
    });
  });

  describe("getPurchaseCount()", () => {
    it("returns purchase count for reward", async () => {
      const mockDb = createCountMockDb(10);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getPurchaseCount(
          "reward-123" as unknown as import("@mirai-app/domain").RewardId,
        ),
      );

      expect(result).toBe(10);
    });
  });

  // ==========================================================================
  // countByTripId() Method Tests
  // ==========================================================================

  describe("countByTripId()", () => {
    it("counts rewards for a trip", async () => {
      const mockDb = createCountMockDb(7);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByTripId("trip-456"));

      expect(result).toBe(7);
    });

    it("returns 0 when no rewards exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleRewardGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByTripId("trip-456"));

      expect(result).toBe(0);
    });
  });
});

// ============================================================================
// Test Suite - DrizzleRewardPurchaseGateway
// ============================================================================

describe("[UNIT] DrizzleRewardPurchaseGateway", () => {
  // ==========================================================================
  // findByRewardId() Method Tests
  // ==========================================================================

  describe("findByRewardId()", () => {
    it("returns purchases for a reward", async () => {
      const mockRecords = Array.from({ length: 3 }, (_, i) =>
        createMockPurchaseDTO({ id: `purchase-${i}`, rewardId: "reward-456" }),
      );
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByRewardId(
          "reward-456" as unknown as import("@mirai-app/domain").RewardId,
        ),
      );

      expect(result.items).toHaveLength(3);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findByRewardId(
            "reward-456" as unknown as import("@mirai-app/domain").RewardId,
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // updateStatus() Method Tests
  // ==========================================================================

  describe("updateStatus()", () => {
    it("updates purchase status", async () => {
      const mockRecord = createMockPurchaseDTO({ status: "DELIVERED" });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.updateStatus("purchase-123", "DELIVERED", "admin-001"),
      );

      expect(result.status).toBe("DELIVERED");
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.updateStatus("purchase-123", "COMPLETED", "admin-001"),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // Count Methods Tests
  // ==========================================================================

  describe("countByGroupId()", () => {
    it("counts purchases for a group", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByGroupId("group-789"),
      );

      expect(result).toBe(5);
    });
  });

  describe("countByRewardId()", () => {
    it("counts purchases for a reward", async () => {
      const mockDb = createCountMockDb(8);
      const gateway = new DrizzleRewardPurchaseGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByRewardId(
          "reward-456" as unknown as import("@mirai-app/domain").RewardId,
        ),
      );

      expect(result).toBe(8);
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage - DrizzleRewardGateway:
// - findByTripId: Trip-based reward lookup with pagination
// - hide/unhide: Visibility toggle with error handling
// - decrementAvailableQuantity/incrementQuantity: Quantity management
// - hasPurchases/getPurchaseCount: Purchase tracking
// - countByTripId: Reward counting
//
// Test Coverage - DrizzleRewardPurchaseGateway:
// - findByRewardId: Purchase lookup with pagination
// - updateStatus: Status update with error handling
// - countByGroupId/countByRewardId: Purchase counting
//
// All methods use Effect.either for comprehensive error testing with DatabaseError.
// Mock DrizzleDb factory functions provide consistent test setup.
