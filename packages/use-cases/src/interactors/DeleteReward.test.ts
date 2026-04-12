import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  deleteRewardUseCase,
  type DeleteRewardInput,
  RewardNotFoundError,
  RewardHasPurchasesError,
} from "./DeleteReward";
import { Reward, RewardId } from "@mirai-app/domain";
import { RewardRepositoryTag } from "../ports/RewardRepository";

describe("[UNIT] deleteRewardUseCase (Effect)", () => {
  // Helper to create a valid reward
  const createValidReward = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string;
    }>,
  ): Reward => {
    const rewardId = RewardId.unsafeCreate(overrides?.id ?? "reward-123");

    const effect = Reward.create({
      id: rewardId,
      name: overrides?.name ?? "Test Reward",
      description: "A test reward description",
      availableQuantity: 10,
      coinCostPercentage: 10,
      images: [],
      isHidden: false,
      tripId: overrides?.tripId ?? "trip-123",
      createdById: "user-123",
    });
    return Effect.runSync(effect);
  };

  const createMockRepo = (overrides?: {
    findById?: () => Effect.Effect<Reward | null, never, never>;
    hasPurchases?: () => Effect.Effect<boolean, never, never>;
    delete?: () => Effect.Effect<void, never, never>;
  }) => ({
    findById: overrides?.findById ?? (() => Effect.succeed(null)),
    hasPurchases: overrides?.hasPurchases ?? (() => Effect.succeed(false)),
    delete: overrides?.delete ?? (() => Effect.succeed(void 0)),
    create: () => Effect.succeed(createValidReward()),
    findByTripId: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    findVisibleByTripId: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    update: () => Effect.succeed(createValidReward()),
    getPurchaseCount: () => Effect.succeed(0),
    decrementQuantity: () => Effect.succeed(createValidReward()),
    incrementQuantity: () => Effect.succeed(createValidReward()),
  });

  describe("execute", () => {
    it("should delete reward successfully when no purchases exist", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const mockReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockReward),
        hasPurchases: () => Effect.succeed(false),
        delete: () => Effect.succeed(void 0),
      });

      const input: DeleteRewardInput = { rewardId };

      const program = deleteRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should return error when reward not found", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("non-existent");

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(null),
      });

      const input: DeleteRewardInput = { rewardId };

      const program = deleteRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, mockRepo),
      );

      // Act
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RewardNotFoundError);
      }
    });

    it("should return error when reward has purchases", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-with-purchases");
      const mockReward = createValidReward({ id: "reward-with-purchases" });

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockReward),
        hasPurchases: () => Effect.succeed(true),
      });

      const input: DeleteRewardInput = { rewardId };

      const program = deleteRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, mockRepo),
      );

      // Act
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RewardHasPurchasesError);
      }
    });
  });
});
