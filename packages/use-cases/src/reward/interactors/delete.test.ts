import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteRewardUseCase,
  type DeleteRewardInput,
  RewardNotFoundError,
  RewardHasPurchasesError,
} from "./delete";
import { RewardGatewayTag, type RewardGateway } from "../ports/gateway";
import type { RewardDTO } from "../dto";
import { DatabaseError, RewardStatus, RewardId } from "@mirai-app/domain";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailHasPurchases?: boolean;
    shouldFailDelete?: boolean;
    hasPurchases?: boolean;
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

    findByTripId: () =>
      Effect.succeed({
        items: Array.from(rewardMap.values()),
        total: rewardMap.size,
        limit: rewardMap.size,
        offset: 0,
        hasMore: false,
      }),

    findVisibleByTripId: () =>
      Effect.succeed({
        items: Array.from(rewardMap.values()).filter((r) => !r.isHidden),
        total: rewardMap.size,
        limit: rewardMap.size,
        offset: 0,
        hasMore: false,
      }),

    update: (reward: RewardDTO) => Effect.succeed(reward),

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      rewardMap.delete(id);
      return Effect.succeed(void 0);
    },

    hasPurchases: () => {
      if (options.shouldFailHasPurchases) {
        return Effect.fail(
          new DatabaseError({
            operation: "hasPurchases",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(options.hasPurchases ?? false);
    },

    getPurchaseCount: () => Effect.succeed(0),

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
    description: overrides.description ?? null,
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

describe("[UNIT] deleteRewardUseCase", () => {
  it("should delete reward successfully when no purchases exist", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-456",
      title: "Deletable Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward], {
      hasPurchases: false,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("reward-456"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should fail with RewardNotFoundError when reward does not exist", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("non-existent"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardNotFoundError);
      expect(either.left.message).toBe("Reward not found");
    }
  });

  it("should fail with RewardHasPurchasesError when reward has purchases", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-with-purchases",
      title: "Popular Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward], {
      hasPurchases: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("reward-with-purchases"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardHasPurchasesError);
      expect(either.left.message).toBe(
        "Cannot delete reward with existing purchases",
      );
    }
  });

  it("should handle database errors during find", async () => {
    const mockGateway = createMockRewardGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("reward-db-fail"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during hasPurchases check", async () => {
    const mockReward = createMockRewardDTO({ id: "reward-check-fail" });
    const mockGateway = createMockRewardGateway([mockReward], {
      shouldFailHasPurchases: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("reward-check-fail"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during delete", async () => {
    const mockReward = createMockRewardDTO({ id: "reward-delete-fail" });
    const mockGateway = createMockRewardGateway([mockReward], {
      hasPurchases: false,
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: DeleteRewardInput = {
      rewardId: RewardId.unsafeCreate("reward-delete-fail"),
    };
    const program = deleteRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
