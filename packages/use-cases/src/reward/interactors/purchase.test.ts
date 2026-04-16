import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  purchaseRewardUseCase,
  type PurchaseRewardInput,
  RewardNotFoundError,
  TripEndedError,
  RewardHiddenError,
  InsufficientQuantityError,
  NotGroupLeaderError,
  InsufficientCoinsError,
  RewardRepositoryError,
  TripAccessCheckerError,
  TripPointsCalculatorError,
  GroupCoinsServiceError,
  PurchaseCreationError,
} from "./purchase";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
  type RewardGateway,
  type RewardPurchaseGateway,
  type TripPointsCalculator,
} from "../ports/gateway";
import {
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
  type GroupCoinsService,
  type TripAccessChecker,
} from "../../trip/ports/gateway";
import type { RewardDTO, RewardPurchaseDTO } from "../dto";
import { DatabaseError, RewardStatus, PurchaseStatus } from "@mirai-app/domain";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailDecrement?: boolean;
  } = {},
): RewardGateway {
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));

  return {
    create: (reward: RewardDTO) => {
      rewardMap.set(reward.id, reward);
      return Effect.succeed(reward);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
      const reward = rewardMap.get(id);
      return Effect.succeed(reward ?? null);
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

    update: (reward: RewardDTO) => Effect.succeed(reward),

    delete: () => Effect.succeed(void 0),

    hasPurchases: () => Effect.succeed(false),

    getPurchaseCount: () => Effect.succeed(0),

    decrementQuantity: (id: string, amount: number) => {
      if (options.shouldFailDecrement) {
        return Effect.fail(
          new DatabaseError({
            operation: "decrementQuantity",
            message: "Failed to decrement",
          }),
        );
      }
      const reward = rewardMap.get(id);
      if (reward) {
        const updated = {
          ...reward,
          availableQuantity: reward.availableQuantity - amount,
        };
        rewardMap.set(id, updated);
        return Effect.succeed(updated);
      }
      return Effect.fail(
        new DatabaseError({
          operation: "decrementQuantity",
          message: "Reward not found",
        }),
      );
    },

    incrementQuantity: (id: string) => {
      const reward = rewardMap.get(id);
      return reward
        ? Effect.succeed(reward)
        : Effect.fail(
            new DatabaseError({
              operation: "incrementQuantity",
              message: "Reward not found",
            }),
          );
    },
  };
}

/**
 * Mock RewardPurchaseGateway for testing
 */
function createMockRewardPurchaseGateway(
  options: {
    shouldFailCreate?: boolean;
  } = {},
): RewardPurchaseGateway {
  const purchaseMap = new Map<string, RewardPurchaseDTO>();

  return {
    create: (purchase: RewardPurchaseDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Failed to create purchase",
          }),
        );
      }
      purchaseMap.set(purchase.id, purchase);
      return Effect.succeed(purchase);
    },

    findById: () => Effect.succeed(null),

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
        totalCount: 0,
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
        totalCount: 0,
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
        totalCount: 0,
      }),

    updateStatus: (id: string, status: string) => {
      const purchase = purchaseMap.get(id);
      if (purchase) {
        const updated = { ...purchase, status: status as PurchaseStatus };
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
 * Mock TripPointsCalculator for testing
 */
function createMockTripPointsCalculator(
  options: {
    totalPoints?: number;
    shouldFail?: boolean;
  } = {},
): TripPointsCalculator {
  return {
    calculateTotalAvailablePoints: () => {
      if (options.shouldFail) {
        return Effect.fail(
          new DatabaseError({
            operation: "calculateTotalAvailablePoints",
            message: "Failed to calculate points",
          }),
        );
      }
      return Effect.succeed(options.totalPoints ?? 1000);
    },
  };
}

/**
 * Mock GroupCoinsService for testing
 */
function createMockGroupCoinsService(
  options: {
    balance?: number;
    shouldFailGetBalance?: boolean;
    shouldFailDeduct?: boolean;
  } = {},
): GroupCoinsService {
  let currentBalance = options.balance ?? 1000;

  return {
    addCoins: () =>
      Effect.succeed({
        id: "transaction-123",
        groupId: "group-123",
        amount: 100,
        type: "ADD",
        reason: "Test",
        createdById: "user-123",
        createdAt: new Date(),
      }),
    getBalance: () => {
      if (options.shouldFailGetBalance) {
        return Effect.fail(new Error("Failed to get balance"));
      }
      return Effect.succeed(currentBalance);
    },
    deductCoins: (groupId: string, amount: number) => {
      if (options.shouldFailDeduct) {
        return Effect.fail(new Error("Failed to deduct coins"));
      }
      currentBalance -= amount;
      return Effect.succeed(void 0);
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
    hasTripEnded?: boolean;
    shouldFailHasTripEnded?: boolean;
    shouldFailIsGroupLeader?: boolean;
  } = {},
): TripAccessChecker {
  return {
    isStaff: () => Effect.succeed(options.isStaff ?? false),
    isGroupLeader: () => {
      if (options.shouldFailIsGroupLeader) {
        return Effect.fail(new Error("Failed to check leader status"));
      }
      return Effect.succeed({
        isLeader: options.isGroupLeader ?? true,
        groupId: options.groupId ?? "group-123",
        groupName: "Test Group",
        coins: 1000,
      });
    },
    hasTripEnded: () => {
      if (options.shouldFailHasTripEnded) {
        return Effect.fail(new Error("Failed to check trip status"));
      }
      return Effect.succeed(options.hasTripEnded ?? false);
    },
  };
}

function createMockRewardDTO(overrides: Partial<RewardDTO> = {}): RewardDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "reward-123",
    tripId: overrides.tripId ?? "trip-123",
    title: overrides.title ?? "Test Reward",
    description: overrides.description ?? "Test reward description",
    imageUrl: overrides.imageUrl ?? null,
    pointsCost: overrides.pointsCost ?? 100,
    quantity: overrides.quantity ?? null,
    availableQuantity: overrides.availableQuantity ?? 10,
    status: overrides.status ?? RewardStatus.ACTIVE,
    isHidden: overrides.isHidden ?? false,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] purchaseRewardUseCase", () => {
  it("should purchase reward successfully when all conditions met", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-purchase",
      title: "Purchasable Reward",
      availableQuantity: 10,
      pointsCost: 50,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      groupId: "group-123",
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-purchase",
      quantity: 2,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const result = await Effect.runPromise(program);

    expect(result.rewardId).toBe("reward-purchase");
    expect(result.quantity).toBe(2);
    expect(result.groupId).toBe("group-123");
    expect(result.remainingRewardQuantity).toBe(8);
  });

  it("should fail with RewardNotFoundError when reward does not exist", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "non-existent",
      quantity: 1,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardNotFoundError);
    }
  });

  it("should fail with TripEndedError when trip has ended", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-ended",
      title: "Ended Trip Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      hasTripEnded: true,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-ended",
      quantity: 1,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TripEndedError);
    }
  });

  it("should fail with RewardHiddenError when reward is hidden", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-hidden",
      title: "Hidden Reward",
      isHidden: true,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-hidden",
      quantity: 1,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardHiddenError);
    }
  });

  it("should fail with InsufficientQuantityError when not enough quantity", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-low",
      title: "Low Stock Reward",
      availableQuantity: 2,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-low",
      quantity: 5,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InsufficientQuantityError);
      expect(either.left.requested).toBe(5);
      expect(either.left.available).toBe(2);
    }
  });

  it("should fail with NotGroupLeaderError when user is not a group leader", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-leader",
      title: "Leader Only Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 1000 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: false,
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-leader",
      quantity: 1,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotGroupLeaderError);
    }
  });

  it("should fail with InsufficientCoinsError when group has insufficient coins", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-expensive",
      title: "Expensive Reward",
      pointsCost: 500,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockPurchaseGateway = createMockRewardPurchaseGateway();
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });
    const mockCoinsService = createMockGroupCoinsService({ balance: 100 });
    const mockAccessChecker = createMockTripAccessChecker({
      isGroupLeader: true,
      hasTripEnded: false,
    });

    const layers = Layer.mergeAll(
      Layer.succeed(RewardGatewayTag, mockGateway),
      Layer.succeed(RewardPurchaseGatewayTag, mockPurchaseGateway),
      Layer.succeed(TripPointsCalculatorTag, mockPointsCalculator),
      Layer.succeed(GroupCoinsServiceTag, mockCoinsService),
      Layer.succeed(TripAccessCheckerTag, mockAccessChecker),
    );

    const input: PurchaseRewardInput = {
      rewardId: "reward-expensive",
      quantity: 1,
      userId: "user-123",
    };

    const program = purchaseRewardUseCase(input).pipe(Effect.provide(layers));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InsufficientCoinsError);
    }
  });
});
