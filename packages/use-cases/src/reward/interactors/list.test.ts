import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  listRewardsUseCase,
  type ListRewardsInput,
  ListRewardsError,
  RewardRepositoryError,
  TripPointsCalculatorError,
} from "./list";
import {
  RewardGatewayTag,
  TripPointsCalculatorTag,
  type RewardGateway,
  type TripPointsCalculator,
  type PaginationOptions,
  type PaginatedResult,
} from "../ports/gateway";
import type { RewardDTO } from "../dto";
import { DatabaseError, RewardStatus } from "@mirai-app/domain";

/**
 * Extended RewardGateway with the methods used by list.ts
 */
interface ExtendedRewardGateway extends RewardGateway {
  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardDTO>, DatabaseError, never>;
  findVisibleByTripId(
    tripId: string,
    pagination?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardDTO>, DatabaseError, never>;
}

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
): ExtendedRewardGateway {
  return {
    create: (reward: RewardDTO) => Effect.succeed(reward),

    findById: (id: string) => {
      const reward = rewards.find((r) => r.id === id);
      return Effect.succeed(reward ?? null);
    },

    findByTripId: (
      tripId: string,
      options?: { includeHidden?: boolean } & PaginationOptions,
    ) => {
      let filtered = rewards.filter((r) => r.tripId === tripId);
      if (!options?.includeHidden) {
        filtered = filtered.filter((r) => !r.isHidden);
      }
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;
      const paginated = filtered.slice(offset, offset + limit);
      return Effect.succeed({
        items: paginated,
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length,
      });
    },

    findVisibleByTripId: (tripId: string, pagination?: PaginationOptions) => {
      const filtered = rewards.filter(
        (r) => r.tripId === tripId && !r.isHidden,
      );
      const limit = pagination?.limit ?? 10;
      const offset = pagination?.offset ?? 0;
      const paginated = filtered.slice(offset, offset + limit);
      return Effect.succeed({
        items: paginated,
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length,
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
        totalCount: rewards.length,
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
        totalCount: rewards.filter((r) => !r.isHidden).length,
      }),

    update: (reward: RewardDTO) => Effect.succeed(reward),

    delete: () => Effect.succeed(void 0),

    hasPurchases: () => Effect.succeed(false),

    getPurchaseCount: () => Effect.succeed(0),

    decrementQuantity: (id: string) => {
      const reward = rewards.find((r) => r.id === id);
      return reward
        ? Effect.succeed(reward)
        : Effect.fail(
            new DatabaseError({
              operation: "decrementQuantity",
              message: "Reward not found",
            }),
          );
    },

    incrementQuantity: (id: string) => {
      const reward = rewards.find((r) => r.id === id);
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
    status: overrides.status ?? RewardStatus.AVAILABLE,
    isHidden: overrides.isHidden ?? false,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] listRewardsUseCase", () => {
  it("should return list of visible rewards for trip", async () => {
    const mockRewards = [
      createMockRewardDTO({
        id: "reward-1",
        title: "Reward 1",
        isHidden: false,
      }),
      createMockRewardDTO({
        id: "reward-2",
        title: "Reward 2",
        isHidden: false,
      }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123" };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].name).toBe("Reward 1");
    expect(result.items[1].name).toBe("Reward 2");
  });

  it("should include hidden rewards when includeHidden is true", async () => {
    const mockRewards = [
      createMockRewardDTO({
        id: "reward-1",
        title: "Visible Reward",
        isHidden: false,
      }),
      createMockRewardDTO({
        id: "reward-2",
        title: "Hidden Reward",
        isHidden: true,
      }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123", includeHidden: true };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(2);
  });

  it("should calculate dynamic coin cost correctly", async () => {
    const mockRewards = [
      createMockRewardDTO({ id: "reward-1", title: "Reward", pointsCost: 50 }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123" };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items[0].dynamicCoinCost).toBeDefined();
    expect(typeof result.items[0].dynamicCoinCost).toBe("number");
  });

  it("should calculate canAfford when groupCoins provided", async () => {
    const mockRewards = [
      createMockRewardDTO({ id: "reward-1", title: "Reward", pointsCost: 50 }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123", groupCoins: 500 };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items[0].canAfford).toBeDefined();
    expect(typeof result.items[0].canAfford).toBe("boolean");
  });

  it("should fail with TripPointsCalculatorError when points calculation fails", async () => {
    const mockRewards = [createMockRewardDTO({ id: "reward-1" })];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      shouldFail: true,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123" };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TripPointsCalculatorError);
      expect(either.left.message).toBe("Failed to calculate trip points");
    }
  });

  it("should handle pagination options", async () => {
    const mockRewards = [
      createMockRewardDTO({ id: "reward-1", title: "Reward 1" }),
      createMockRewardDTO({ id: "reward-2", title: "Reward 2" }),
      createMockRewardDTO({ id: "reward-3", title: "Reward 3" }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = {
      tripId: "trip-123",
      pagination: { limit: 2, offset: 0 },
    };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.limit).toBe(2);
    expect(result.offset).toBe(0);
  });

  it("should return correct isInStock and canBePurchased flags", async () => {
    const mockRewards = [
      createMockRewardDTO({
        id: "reward-1",
        title: "In Stock",
        availableQuantity: 10,
      }),
      createMockRewardDTO({
        id: "reward-2",
        title: "Out of Stock",
        availableQuantity: 0,
      }),
    ];
    const mockGateway = createMockRewardGateway(mockRewards);
    const mockPointsCalculator = createMockTripPointsCalculator({
      totalPoints: 1000,
    });

    const rewardLayer = Layer.succeed(
      RewardGatewayTag,
      mockGateway as RewardGateway,
    );
    const pointsLayer = Layer.succeed(
      TripPointsCalculatorTag,
      mockPointsCalculator,
    );
    const combinedLayer = Layer.mergeAll(rewardLayer, pointsLayer);

    const input: ListRewardsInput = { tripId: "trip-123", includeHidden: true };
    const program = listRewardsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    const inStockReward = result.items.find((r) => r.name === "In Stock");
    const outOfStockReward = result.items.find(
      (r) => r.name === "Out of Stock",
    );

    expect(inStockReward?.isInStock).toBe(true);
    expect(inStockReward?.canBePurchased).toBe(true);
    expect(outOfStockReward?.isInStock).toBe(false);
    expect(outOfStockReward?.availableQuantity).toBe(0);
  });
});
