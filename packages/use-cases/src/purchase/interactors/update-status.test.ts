import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  PurchaseNotFoundError,
  NotAuthorizedError,
  InvalidPurchaseStatusTransitionError,
  UpdatePurchaseValidationError,
  UpdatePurchaseOperationError,
} from "./update-status";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  type RewardGateway,
  type RewardPurchaseGateway,
} from "../../reward/ports/gateway";
import {
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
  type GroupCoinsService,
  type TripAccessChecker,
} from "../../trip/ports/gateway";
import type { RewardPurchaseDTO } from "../../reward/dto";
import {
  DatabaseError,
  RewardPurchaseStatus,
  RewardId,
} from "@mirai-app/domain";

/**
 * Mock RewardPurchaseGateway for testing
 */
function createMockPurchaseGateway(
  purchases: RewardPurchaseDTO[] = [],
  options: {
    shouldFailFindById?: boolean;
    shouldFailUpdateStatus?: boolean;
  } = {},
): RewardPurchaseGateway {
  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  return {
    create: (purchase: RewardPurchaseDTO) => {
      purchaseMap.set(purchase.id, purchase);
      return Effect.succeed(purchase);
    },

    findById: (id: string) => {
      if (options.shouldFailFindById) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
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

    findByTripId: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),

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

    updateStatus: (
      id: string,
      status: string,
      _updatedById: string,
      collectionMethod?: string | null,
    ) => {
      if (options.shouldFailUpdateStatus) {
        return Effect.fail(
          new DatabaseError({
            operation: "updateStatus",
            message: "Failed to update status",
          }),
        );
      }
      const purchase = purchaseMap.get(id);
      if (purchase) {
        const updated = {
          ...purchase,
          status: status as RewardPurchaseStatus,
          collectionMethod: collectionMethod ?? purchase.collectionMethod,
          updatedAt: new Date(),
        };
        purchaseMap.set(id, updated);
        return Effect.succeed(updated);
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
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  options: {
    shouldFailIncrementQuantity?: boolean;
  } = {},
): RewardGateway {
  return {
    create: (reward) => Effect.succeed(reward),
    findById: () => Effect.succeed(null),
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
        totalCount: 0,
      }),
    findVisibleByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
    update: (reward) => Effect.succeed(reward),
    delete: () => Effect.succeed(void 0),
    hasPurchases: () => Effect.succeed(false),
    getPurchaseCount: () => Effect.succeed(0),
    decrementQuantity: (id) =>
      Effect.succeed({
        id: id.toString(),
        tripId: "trip-123",
        title: "Test Reward",
        description: null,
        imageUrl: null,
        pointsCost: 100,
        quantity: null,
        availableQuantity: 10,
        status: "AVAILABLE" as const,
        isHidden: false,
        createdById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    incrementQuantity: (id, _amount) => {
      if (options.shouldFailIncrementQuantity) {
        return Effect.fail(
          new DatabaseError({
            operation: "incrementQuantity",
            message: "Failed to increment quantity",
          }),
        );
      }
      return Effect.succeed({
        id: id.toString(),
        tripId: "trip-123",
        title: "Test Reward",
        description: null,
        imageUrl: null,
        pointsCost: 100,
        quantity: null,
        availableQuantity: 10,
        status: "AVAILABLE" as const,
        isHidden: false,
        createdById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
  };
}

/**
 * Mock GroupCoinsService for testing
 */
function createMockCoinsService(
  options: {
    shouldFailAddCoins?: boolean;
  } = {},
): GroupCoinsService {
  return {
    addCoins: (
      _groupId: string,
      _amount: number,
      _reason: string,
      _updatedById: string,
    ) => {
      if (options.shouldFailAddCoins) {
        return Effect.fail(
          new DatabaseError({
            operation: "addCoins",
            message: "Failed to add coins",
          }),
        );
      }
      return Effect.succeed({
        id: "transaction-123",
        groupId: "group-123",
        amount: 100,
        type: "EARNED",
        reason: "Test refund",
        createdById: "user-123",
        createdAt: new Date(),
      });
    },
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
    shouldFailIsStaff?: boolean;
    shouldFailIsGroupLeader?: boolean;
  } = {},
): TripAccessChecker {
  return {
    isStaff: () => {
      if (options.shouldFailIsStaff) {
        return Effect.fail(
          new DatabaseError({
            operation: "isStaff",
            message: "Failed to check staff status",
          }),
        );
      }
      return Effect.succeed(options.isStaff ?? false);
    },
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
        groupId: options.groupId ?? "group-123",
        groupName: "Test Group",
        coins: 1000,
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

describe("[UNIT] updatePurchaseStatusUseCase", () => {
  it("should update status for staff user", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      rewardId: "reward-1",
      groupId: "group-456",
      pointsSpent: 100,
      totalCost: 100,
      quantity: 1,
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
      isGroupLeader: false,
      groupId: "group-123",
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "staff-123",
      collectionMethod: "Pickup at hotel",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const result = await Effect.runPromise(program);

    expect(result.purchaseId).toBe("purchase-1");
    expect(result.status).toBe(RewardPurchaseStatus.ACCEPTED);
    expect(result.collectionMethod).toBe("Pickup at hotel");
    expect(result.refunded).toBe(false);
  });

  it("should update status for group leader of the purchase group", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      rewardId: "reward-1",
      groupId: "group-123",
      pointsSpent: 100,
      totalCost: 100,
      quantity: 1,
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: false,
      isGroupLeader: true,
      groupId: "group-123",
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "user-123",
      collectionMethod: "Delivery to room",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const result = await Effect.runPromise(program);

    expect(result.purchaseId).toBe("purchase-1");
    expect(result.status).toBe(RewardPurchaseStatus.ACCEPTED);
    expect(result.refunded).toBe(false);
  });

  it("should cancel purchase with refund for staff user", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      rewardId: "reward-1",
      groupId: "group-123",
      pointsSpent: 100,
      totalCost: 100,
      quantity: 1,
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.CANCELLED,
      updatedById: "staff-123",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const result = await Effect.runPromise(program);

    expect(result.purchaseId).toBe("purchase-1");
    expect(result.status).toBe(RewardPurchaseStatus.CANCELLED);
    expect(result.refunded).toBe(true);
  });

  it("should fail with PurchaseNotFoundError when purchase does not exist", async () => {
    const purchaseGateway = createMockPurchaseGateway([]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "non-existent",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "staff-123",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(PurchaseNotFoundError);
    }
  });

  it("should fail with NotAuthorizedError when non-staff and not group leader", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      groupId: "group-456",
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: false,
      isGroupLeader: true,
      groupId: "group-123",
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "user-123",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotAuthorizedError);
    }
  });

  it("should fail with InvalidPurchaseStatusTransitionError for invalid transition", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.DELIVERED,
      groupId: "group-123",
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "staff-123",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidPurchaseStatusTransitionError);
    }
  });

  it("should fail with UpdatePurchaseValidationError when collection method missing for ACCEPTED", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      groupId: "group-123",
      collectionMethod: null,
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase]);
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "staff-123",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdatePurchaseValidationError);
    }
  });

  it("should fail with UpdatePurchaseOperationError when database fails", async () => {
    const mockPurchase = createMockPurchaseDTO({
      id: "purchase-1",
      status: RewardPurchaseStatus.BOUGHT,
      groupId: "group-123",
    });
    const purchaseGateway = createMockPurchaseGateway([mockPurchase], {
      shouldFailFindById: true,
    });
    const rewardGateway = createMockRewardGateway();
    const coinsService = createMockCoinsService();
    const accessChecker = createMockTripAccessChecker({
      isStaff: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
      Layer.succeed(RewardGatewayTag, rewardGateway),
      Layer.succeed(GroupCoinsServiceTag, coinsService),
      Layer.succeed(TripAccessCheckerTag, accessChecker),
    );

    const input: UpdatePurchaseStatusInput = {
      purchaseId: "purchase-1",
      newStatus: RewardPurchaseStatus.ACCEPTED,
      updatedById: "staff-123",
      collectionMethod: "Test",
    };

    const program = updatePurchaseStatusUseCase(input).pipe(
      Effect.provide(layers),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdatePurchaseOperationError);
    }
  });
});
