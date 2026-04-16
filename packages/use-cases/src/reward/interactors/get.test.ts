import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getRewardUseCase,
  type GetRewardInput,
  RewardNotFoundError,
  RewardRepositoryError,
} from "./get";
import { RewardGatewayTag, type RewardGateway } from "../ports/gateway";
import type { RewardDTO } from "../dto";
import { DatabaseError, RewardStatus, PurchaseStatus } from "@mirai-app/domain";
import type { Decimal } from "@mirai-app/domain";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailPurchaseCount?: boolean;
    purchaseCounts?: Map<string, number>;
  } = {},
): RewardGateway {
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const purchaseCounts = options.purchaseCounts ?? new Map<string, number>();

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

    getPurchaseCount: (id: string) => {
      if (options.shouldFailPurchaseCount) {
        return Effect.fail(
          new DatabaseError({
            operation: "getPurchaseCount",
            message: "Failed to get purchase count",
          }),
        );
      }
      return Effect.succeed(purchaseCounts.get(id) ?? 0);
    },

    decrementQuantity: (id: string) => {
      const reward = rewardMap.get(id);
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

describe("[UNIT] getRewardUseCase", () => {
  it("should return reward when found by ID", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-456",
      title: "Gift Card",
      pointsCost: 500,
      availableQuantity: 20,
    });
    const mockGateway = createMockRewardGateway([mockReward], {
      purchaseCounts: new Map([["reward-456", 5]]),
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-456" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("reward-456");
    expect(result.name).toBe("Gift Card");
    expect(result.availableQuantity).toBe(20);
    expect(result.purchaseCount).toBe(5);
    expect(result.isInStock).toBe(true);
    expect(result.canBePurchased).toBe(true);
  });

  it("should fail with RewardNotFoundError when reward not found", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "non-existent" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardNotFoundError);
      expect(either.left.message).toContain("Reward not found");
    }
  });

  it("should fail with RewardRepositoryError when purchase count fails", async () => {
    const mockReward = createMockRewardDTO({ id: "reward-pc-fail" });
    const mockGateway = createMockRewardGateway([mockReward], {
      shouldFailPurchaseCount: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-pc-fail" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardRepositoryError);
      expect(either.left.message).toBe("Failed to get purchase count");
    }
  });

  it("should handle hidden rewards correctly", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-hidden",
      isHidden: true,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-hidden" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isHidden).toBe(true);
    expect(result.canBePurchased).toBe(false);
  });

  it("should handle out of stock rewards", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-empty",
      availableQuantity: 0,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-empty" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isInStock).toBe(false);
    expect(result.availableQuantity).toBe(0);
  });

  it("should return correct coinCostPercentage", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-cost",
      pointsCost: 250,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-cost" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(typeof result.coinCostPercentage).toBe("number");
    expect(result.coinCostPercentage).toBe(250);
  });

  it("should handle database errors during find", async () => {
    const mockGateway = createMockRewardGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: GetRewardInput = { rewardId: "reward-db-fail" };
    const program = getRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
