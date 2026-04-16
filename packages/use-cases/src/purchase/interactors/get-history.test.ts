import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  NoGroupAccessError,
  PurchaseRepositoryError,
  TripAccessCheckerError,
} from "./get-history";
import {
  RewardPurchaseGatewayTag,
  type RewardPurchaseGateway,
} from "../../reward/ports/gateway";
import {
  TripAccessCheckerTag,
  type TripAccessChecker,
} from "../../trip/ports/gateway";
import type { RewardPurchaseDTO } from "../../reward/dto";
import { DatabaseError, RewardPurchaseStatus } from "@mirai-app/domain";

/**
 * Mock RewardPurchaseGateway for testing
 */
function createMockPurchaseGateway(
  purchases: RewardPurchaseDTO[] = [],
  options: {
    shouldFailFindByTripId?: boolean;
  } = {},
): RewardPurchaseGateway {
  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  return {
    create: (purchase: RewardPurchaseDTO) => {
      purchaseMap.set(purchase.id, purchase);
      return Effect.succeed(purchase);
    },

    findById: (id: string) => {
      const purchase = purchaseMap.get(id);
      return Effect.succeed(purchase ?? null);
    },

    findByRewardIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    findByGroupIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    findByTripId: (_tripId: string, filters?: { groupId?: string }) => {
      if (options.shouldFailFindByTripId) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByTripId",
            message: "Database error",
          }),
        );
      }
      let items = Array.from(purchaseMap.values());
      if (filters?.groupId) {
        items = items.filter((p) => p.groupId === filters.groupId);
      }
      return Effect.succeed({
        items,
        total: items.length,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    },

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    updateStatus: (id: string, status: string) => {
      const purchase = purchaseMap.get(id);
      if (purchase) {
        return Effect.succeed({
          ...purchase,
          status: status as RewardPurchaseStatus,
        });
      }
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: "Purchase not found",
        }),
      );
    },

    countByRewardId: () => Effect.succeed(0),
  };
}

/**
 * Mock TripAccessChecker for testing
 */
function createMockTripAccessChecker(
  options: {
    isStaff?: boolean;
    isGroupLeader?: boolean;
    groupId?: string;
    shouldFailIsGroupLeader?: boolean;
  } = {},
): TripAccessChecker {
  return {
    isStaff: () => Effect.succeed(options.isStaff ?? false),

    isGroupLeader: () => {
      if (options.shouldFailIsGroupLeader) {
        return Effect.fail(
          new DatabaseError({
            operation: "isGroupLeader",
            message: "Failed to check group leader",
          }),
        );
      }
      return Effect.succeed({
        isLeader: options.isGroupLeader ?? true,
        groupId: options.groupId,
        groupName: options.groupId ? "Test Group" : undefined,
        coins: options.groupId ? 1000 : undefined,
      });
    },
  };
}

function createMockPurchaseDTO(
  overrides: Partial<RewardPurchaseDTO> = {},
): RewardPurchaseDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "purchase-123",
    rewardId: overrides.rewardId ?? "reward-123",
    groupId: overrides.groupId ?? "group-123",
    userId: overrides.userId ?? "user-123",
    pointsSpent: overrides.pointsSpent ?? 100,
    totalCost: overrides.totalCost ?? 100,
    status: overrides.status ?? RewardPurchaseStatus.BOUGHT,
    quantity: overrides.quantity ?? 1,
    collectionMethod: overrides.collectionMethod ?? null,
    collectedAt: overrides.collectedAt ?? null,
    collectedById: overrides.collectedById ?? null,
    notes: overrides.notes ?? null,
    purchasedAt: overrides.purchasedAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    statusUpdatedAt: overrides.statusUpdatedAt ?? now,
    statusUpdatedById: overrides.statusUpdatedById ?? null,
  };
}

describe("[UNIT] getPurchaseHistoryUseCase", () => {
  it("should return purchases for staff user", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      rewardId: "reward-1",
      groupId: "group-1",
      quantity: 2,
      pointsSpent: 200,
      totalCost: 200,
      status: RewardPurchaseStatus.BOUGHT,
    });
    const mockGateway = createMockPurchaseGateway([mockPurchase]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "staff-123",
      isStaff: true,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].purchaseId).toBe("purchase-1");
    expect(result.items[0].rewardId).toBe("reward-1");
    expect(result.items[0].groupId).toBe("group-1");
    expect(result.items[0].quantity).toBe(2);
    expect(result.total).toBe(1);
  });

  it("should return purchases filtered by group for regular user", async () => {
    const mockPurchase1 = createMockPurchaseDTO({
      id: "purchase-1",
      groupId: "group-123",
      rewardId: "reward-1",
    });
    const mockPurchase2 = createMockPurchaseDTO({
      id: "purchase-2",
      groupId: "group-456",
      rewardId: "reward-2",
    });
    const mockGateway = createMockPurchaseGateway([
      mockPurchase1,
      mockPurchase2,
    ]);
    const mockAccessChecker = createMockTripAccessChecker({
      isStaff: false,
      isGroupLeader: true,
      groupId: "group-123",
    });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "user-123",
      isStaff: false,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    // Should only see purchases from their own group
    expect(result.items).toHaveLength(1);
    expect(result.items[0].groupId).toBe("group-123");
  });

  it("should fail with NoGroupAccessError when user has no group", async () => {
    const mockGateway = createMockPurchaseGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({
      isStaff: false,
      isGroupLeader: false,
      groupId: undefined,
    });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "user-123",
      isStaff: false,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NoGroupAccessError);
    }
  });

  it("should fail with PurchaseRepositoryError when database fails", async () => {
    const mockGateway = createMockPurchaseGateway([], {
      shouldFailFindByTripId: true,
    });
    const mockAccessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "staff-123",
      isStaff: true,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(PurchaseRepositoryError);
      expect(either.left.message).toBe("Failed to fetch purchase history");
    }
  });

  it("should fail with TripAccessCheckerError when group leader check fails", async () => {
    const mockGateway = createMockPurchaseGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({
      isStaff: false,
      shouldFailIsGroupLeader: true,
    });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "user-123",
      isStaff: false,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TripAccessCheckerError);
    }
  });

  it("should apply group filter when groupId is provided", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      groupId: "filtered-group",
      rewardId: "reward-1",
    });
    const mockGateway = createMockPurchaseGateway([mockPurchase]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "staff-123",
      isStaff: true,
      groupId: "filtered-group",
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].groupId).toBe("filtered-group");
  });

  it("should return empty result when no purchases exist", async () => {
    const mockGateway = createMockPurchaseGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });

    const gatewayLayer = Layer.succeed(RewardPurchaseGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(TripAccessCheckerTag, mockAccessChecker);
    const combinedLayer = Layer.merge(gatewayLayer, accessLayer);

    const input: GetPurchaseHistoryInput = {
      tripId: "trip-123",
      userId: "staff-123",
      isStaff: true,
    };

    const program = getPurchaseHistoryUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
