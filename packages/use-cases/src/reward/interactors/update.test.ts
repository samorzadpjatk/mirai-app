import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateRewardUseCase,
  type UpdateRewardInput,
  RewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError,
} from "./update";
import { Reward, RewardId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import { InMemoryRewardGateway } from "@mirai-app/adapters";

describe("[UNIT] updateRewardUseCase (Effect)", () => {
  let rewardRepo: InMemoryRewardGateway;

  // Helper to create a valid reward
  const createValidReward = (
    overrides?: Partial<{
      id: string;
      name: string;
      description: string;
      availableQuantity: number;
      tripId: string;
    }>,
  ): Reward => {
    const rewardId = RewardId.unsafeCreate(overrides?.id ?? "reward-123");

    const result = Reward.create({
      id: rewardId,
      name: overrides?.name ?? "Test Reward",
      description: overrides?.description ?? "A test reward description",
      availableQuantity: overrides?.availableQuantity ?? 10,
      coinCostPercentage: 10,
      images: [],
      isHidden: false,
      tripId: overrides?.tripId ?? "trip-123",
      createdById: "user-123",
    });

    // Since Reward.create returns Effect, we need to run it
    return Effect.runSync(result);
  };

  beforeEach(() => {
    rewardRepo = new InMemoryRewardGateway();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateRewardInput) => {
    const program = updateRewardUseCase(input).pipe(
      Effect.provideService(RewardGatewayTag, {
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
    it("should update reward name successfully", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({
        id: "reward-456",
        name: "Old Name",
      });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        name: "New Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("New Name");
      expect(result.id).toBe("reward-456");

      // Verify stored reward was updated
      const stored = Effect.runSync(rewardRepo.findById("reward-456"));
      expect(stored?.name).toBe("New Name");
    });

    it("should update reward description", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({ id: "reward-456" });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        description: "Updated description",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBe("Updated description");
    });

    it("should update available quantity", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({
        id: "reward-456",
        availableQuantity: 10,
      });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        availableQuantity: 20,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.availableQuantity).toBe(20);
    });

    it("should update images", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({ id: "reward-456" });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        images: [
          "https://example.com/image1.png",
          "https://example.com/image2.png",
        ],
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.images).toEqual([
        "https://example.com/image1.png",
        "https://example.com/image2.png",
      ]);
    });

    it("should update coin cost percentage", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({ id: "reward-456" });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        coinCostPercentage: 25,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.coinCostPercentage).toBe(25);
    });

    it("should return RewardNotFoundError when reward not found", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("non-existent");

      const input: UpdateRewardInput = {
        rewardId,
        name: "New Name",
      };

      // Act
      const program = updateRewardUseCase(input).pipe(
        Effect.provideService(RewardGatewayTag, {
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
        expect(either.left.message).toContain("non-existent");
      }
    });

    it("should return UpdateRewardError when validation fails", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({ id: "reward-456" });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        name: "", // Invalid empty name
      };

      // Act
      const program = updateRewardUseCase(input).pipe(
        Effect.provideService(RewardGatewayTag, {
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
        expect(either.left).toBeInstanceOf(UpdateRewardError);
      }
    });

    it("should include calculated fields in output", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const existingReward = createValidReward({ id: "reward-456" });
      Effect.runSync(rewardRepo.create(existingReward));

      const input: UpdateRewardInput = {
        rewardId,
        name: "Updated Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isInStock).toBeDefined();
      expect(result.canBePurchased).toBeDefined();
      expect(result.primaryImage).toBeDefined();
      expect(result.tripId).toBeDefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
