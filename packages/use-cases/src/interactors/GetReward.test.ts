import { describe, it, expect, beforeEach } from "bun:test";
import {
  getRewardUseCase,
  type GetRewardInput,
  RewardNotFoundError,
  RewardRepositoryError,
} from "./GetReward";
import { Reward, RewardId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { RewardRepositoryTag } from "../ports/RewardRepository";
import { InMemoryRewardRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getRewardUseCase (Effect)", () => {
  let rewardRepo: InMemoryRewardRepository;

  // Helper to create a valid reward
  const createValidReward = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string;
      availableQuantity: number;
    }>,
  ): Reward => {
    const rewardId = RewardId.unsafeCreate(overrides?.id ?? "reward-123");

    const result = Reward.create({
      id: rewardId,
      name: overrides?.name ?? "Test Reward",
      description: "A test reward description",
      availableQuantity: overrides?.availableQuantity ?? 10,
      coinCostPercentage: 10,
      images: ["https://example.com/image.png"],
      isHidden: false,
      tripId: overrides?.tripId ?? "trip-123",
      createdById: "user-123",
    });

    return Effect.runSync(result);
  };

  beforeEach(() => {
    rewardRepo = new InMemoryRewardRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetRewardInput) => {
    const program = getRewardUseCase(input).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward: Reward) => rewardRepo.create(reward),
        findById: (id: string) => rewardRepo.findById(id),
        findByTripId: (tripId: string, options?) =>
          rewardRepo.findByTripId(tripId, options),
        findVisibleByTripId: (tripId: string, options?) =>
          rewardRepo.findVisibleByTripId(tripId, options),
        update: (reward: Reward) => rewardRepo.update(reward),
        delete: (id: string) => rewardRepo.delete(id),
        hasPurchases: (id: string) => rewardRepo.hasPurchases(id),
        getPurchaseCount: (id: string) => rewardRepo.getPurchaseCount(id),
        decrementQuantity: (id: string, amount: number) =>
          rewardRepo.decrementQuantity(id, amount),
        incrementQuantity: (id: string, amount: number) =>
          rewardRepo.incrementQuantity(id, amount),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return reward with purchase count when found", async () => {
      // Arrange
      const reward = createValidReward({ id: "reward-123" });
      Effect.runSync(rewardRepo.create(reward));
      rewardRepo.seedPurchases([]);

      const input: GetRewardInput = { rewardId: RewardId.create("reward-123") };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("reward-123");
      expect(result.name).toBe("Test Reward");
      expect(result.description).toBe("A test reward description");
      expect(result.availableQuantity).toBe(10);
      expect(result.coinCostPercentage).toBe(10);
      expect(result.images).toEqual(["https://example.com/image.png"]);
      expect(result.primaryImage).toBe("https://example.com/image.png");
      expect(result.isHidden).toBe(false);
      expect(result.tripId).toBe("trip-123");
      expect(result.createdById).toBe("user-123");
      expect(result.isInStock).toBe(true);
      expect(result.canBePurchased).toBe(true);
      expect(result.purchaseCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should return RewardNotFoundError when reward not found", async () => {
      // Arrange
      const input: GetRewardInput = { rewardId: "nonexistent" as RewardId };

      // Act
      const program = getRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, {
          create: (reward: Reward) => rewardRepo.create(reward),
          findById: (id: string) => rewardRepo.findById(id),
          findByTripId: (tripId: string, options?) =>
            rewardRepo.findByTripId(tripId, options),
          findVisibleByTripId: (tripId: string, options?) =>
            rewardRepo.findVisibleByTripId(tripId, options),
          update: (reward: Reward) => rewardRepo.update(reward),
          delete: (id: string) => rewardRepo.delete(id),
          hasPurchases: (id: string) => rewardRepo.hasPurchases(id),
          getPurchaseCount: (id: string) => rewardRepo.getPurchaseCount(id),
          decrementQuantity: (id: string, amount: number) =>
            rewardRepo.decrementQuantity(id, amount),
          incrementQuantity: (id: string, amount: number) =>
            rewardRepo.incrementQuantity(id, amount),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RewardNotFoundError);
        expect(either.left.message).toContain("nonexistent");
      }
    });

    it("should return reward with zero purchase count", async () => {
      // Arrange
      const reward = createValidReward({ id: "reward-123" });
      Effect.runSync(rewardRepo.create(reward));

      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.purchaseCount).toBe(0);
    });

    it("should handle hidden rewards", async () => {
      // Arrange
      const rewardResult = Reward.create({
        id: "reward-123" as RewardId,
        name: "Hidden Reward",
        description: "A hidden reward",
        availableQuantity: 10,
        coinCostPercentage: 10,
        images: [],
        isHidden: true,
        tripId: "trip-123",
        createdById: "user-123",
      });
      const reward = Effect.runSync(rewardResult);
      Effect.runSync(rewardRepo.create(reward));

      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isHidden).toBe(true);
    });

    it("should handle rewards with null primary image", async () => {
      // Arrange
      const rewardResult = Reward.create({
        id: "reward-123" as RewardId,
        name: "Reward with no images",
        description: "A reward without images",
        availableQuantity: 10,
        coinCostPercentage: 10,
        images: [],
        isHidden: false,
        tripId: "trip-123",
        createdById: "user-123",
      });
      const reward = Effect.runSync(rewardResult);
      Effect.runSync(rewardRepo.create(reward));

      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.primaryImage).toBeNull();
    });

    it("should handle out of stock rewards", async () => {
      // Arrange
      const reward = createValidReward({
        id: "reward-123",
        availableQuantity: 0,
      });
      Effect.runSync(rewardRepo.create(reward));

      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isInStock).toBe(false);
      expect(result.canBePurchased).toBe(false);
    });
  });
});
