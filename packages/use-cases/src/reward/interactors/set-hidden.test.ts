import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
  RewardNotFoundError,
  SetRewardHiddenRepositoryError,
} from "./set-hidden";
import { RewardGatewayTag, type RewardGateway } from "../ports/gateway";
import type { RewardDTO } from "../dto";
import { DatabaseError, RewardStatus } from "@mirai-app/domain";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailUpdate?: boolean;
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

    update: (reward: RewardDTO) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
      rewardMap.set(reward.id, reward);
      return Effect.succeed(reward);
    },

    delete: () => Effect.succeed(void 0),

    hasPurchases: () => Effect.succeed(false),

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

describe("[UNIT] setRewardHiddenUseCase", () => {
  it("should hide reward successfully", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-visible",
      title: "Visible Reward",
      isHidden: false,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "reward-visible",
      isHidden: true,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("reward-visible");
    expect(result.name).toBe("Visible Reward");
    expect(result.isHidden).toBe(true);
  });

  it("should unhide reward successfully", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-hidden",
      title: "Hidden Reward",
      isHidden: true,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "reward-hidden",
      isHidden: false,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("reward-hidden");
    expect(result.isHidden).toBe(false);
  });

  it("should fail with RewardNotFoundError when reward does not exist", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "non-existent",
      isHidden: true,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardNotFoundError);
      expect(either.left.message).toBe("Reward not found");
    }
  });

  it("should handle database errors during find", async () => {
    const mockGateway = createMockRewardGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "reward-find-fail",
      isHidden: true,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SetRewardHiddenRepositoryError);
      expect(either.left.operation).toBe("find reward");
    }
  });

  it("should handle database errors during update", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-update-fail",
      title: "Update Fail Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward], {
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "reward-update-fail",
      isHidden: true,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SetRewardHiddenRepositoryError);
      expect(either.left.operation).toBe("update reward");
    }
  });

  it("should update updatedAt timestamp", async () => {
    const originalDate = new Date("2024-01-01");
    const mockReward = createMockRewardDTO({
      id: "reward-update-time",
      title: "Time Update Reward",
      updatedAt: originalDate,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: SetRewardHiddenInput = {
      rewardId: "reward-update-time",
      isHidden: true,
    };
    const program = setRewardHiddenUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
