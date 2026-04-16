import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateRewardUseCase,
  type UpdateRewardInput,
  RewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError,
} from "./update";
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

describe("[UNIT] updateRewardUseCase", () => {
  it("should update reward successfully", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-update",
      title: "Original Title",
      description: "Original Description",
      availableQuantity: 10,
      pointsCost: 100,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-update",
      name: "Updated Title",
      description: "Updated Description",
      availableQuantity: 20,
      coinCostPercentage: 150,
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("reward-update");
    expect(result.name).toBe("Updated Title");
    expect(result.description).toBe("Updated Description");
    expect(result.availableQuantity).toBe(20);
    expect(result.coinCostPercentage).toBe(150);
  });

  it("should fail with RewardNotFoundError when reward does not exist", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "non-existent",
      name: "Updated Title",
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardNotFoundError);
      expect(either.left.message).toContain("Reward not found");
    }
  });

  it("should update only provided fields", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-partial",
      title: "Original Title",
      description: "Original Description",
      availableQuantity: 10,
      pointsCost: 100,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-partial",
      name: "Only Title Updated",
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Only Title Updated");
    expect(result.description).toBe("Original Description");
    expect(result.availableQuantity).toBe(10);
  });

  it("should handle database errors during find", async () => {
    const mockGateway = createMockRewardGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-find-fail",
      name: "Updated Title",
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during update", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-update-fail",
      title: "Original Title",
    });
    const mockGateway = createMockRewardGateway([mockReward], {
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-update-fail",
      name: "Updated Title",
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardRepositoryError);
      expect(either.left.message).toBe("Failed to update reward");
    }
  });

  it("should update images", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-images",
      title: "Image Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-images",
      images: ["new-image1.jpg", "new-image2.jpg"],
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.images).toEqual(["new-image1.jpg", "new-image2.jpg"]);
  });

  it("should return correct isInStock and canBePurchased flags", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-flags",
      title: "Flag Test Reward",
      availableQuantity: 0,
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-flags",
      name: "Updated Name",
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isInStock).toBe(false);
    expect(result.canBePurchased).toBe(false);
  });

  it("should include primaryImage in output", async () => {
    const mockReward = createMockRewardDTO({
      id: "reward-primary",
      title: "Primary Image Reward",
    });
    const mockGateway = createMockRewardGateway([mockReward]);
    const mockLayer = Layer.succeed(RewardGatewayTag, mockGateway);

    const input: UpdateRewardInput = {
      rewardId: "reward-primary",
      images: ["primary.jpg", "secondary.jpg"],
    };

    const program = updateRewardUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.primaryImage).toBeDefined();
  });
});
