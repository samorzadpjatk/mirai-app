import { describe, it, expect, beforeEach } from "bun:test";
import {
  listRewardsUseCase,
  type ListRewardsInput,
  ListRewardsError,
  RewardRepositoryError,
  TripPointsCalculatorError,
} from "./ListRewards";
import { Reward, RewardId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import {
  RewardRepositoryTag,
  TripPointsCalculatorTag,
  type PaginatedResult,
} from "../ports/RewardRepository";
import { InMemoryRewardRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] listRewardsUseCase (Effect)", () => {
  let rewardRepo: InMemoryRewardRepository;

  // Helper to create a valid reward
  const createValidReward = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string;
      availableQuantity: number;
      isHidden?: boolean;
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
      isHidden: overrides?.isHidden ?? false,
      tripId: overrides?.tripId ?? "trip-123",
      createdById: "user-123",
    });

    return Effect.runSync(result);
  };

  // Helper to run use case with mocked services
  const runUseCase = async (
    input: ListRewardsInput,
    totalPoints: number = 1000,
  ) => {
    const program = listRewardsUseCase(input).pipe(
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
      Effect.provideService(TripPointsCalculatorTag, {
        calculateTotalAvailablePoints: () => Effect.succeed(totalPoints),
      }),
    );
    return await Effect.runPromise(program);
  };

  beforeEach(() => {
    rewardRepo = new InMemoryRewardRepository();
  });

  describe("[UNIT] execute", () => {
    it("should list all visible rewards for a trip", async () => {
      // Arrange
      const reward1 = createValidReward({ id: "reward-1", name: "Reward 1" });
      const reward2 = createValidReward({ id: "reward-2", name: "Reward 2" });
      Effect.runSync(rewardRepo.create(reward1));
      Effect.runSync(rewardRepo.create(reward2));

      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it("should include hidden rewards when includeHidden is true", async () => {
      // Arrange
      const visibleReward = createValidReward({
        id: "reward-1",
        name: "Visible Reward",
      });
      const hiddenReward = createValidReward({
        id: "reward-hidden",
        name: "Hidden Reward",
        isHidden: true,
      });
      Effect.runSync(rewardRepo.create(visibleReward));
      Effect.runSync(rewardRepo.create(hiddenReward));

      const input: ListRewardsInput = {
        tripId: "trip-123",
        includeHidden: true,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should exclude hidden rewards by default", async () => {
      // Arrange
      const visibleReward = createValidReward({
        id: "reward-1",
        name: "Visible Reward",
      });
      const hiddenReward = createValidReward({
        id: "reward-hidden",
        name: "Hidden Reward",
        isHidden: true,
      });
      Effect.runSync(rewardRepo.create(visibleReward));
      Effect.runSync(rewardRepo.create(hiddenReward));

      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("Visible Reward");
    });

    it("should calculate dynamic coin costs", async () => {
      // Arrange
      const reward = createValidReward({ id: "reward-1", name: "Reward 1" });
      Effect.runSync(rewardRepo.create(reward));

      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input, 1000);

      // Assert
      expect(result.items[0]?.dynamicCoinCost).toBeDefined();
      expect(result.items[0]?.coinCostPercentage).toBe(10);
      // Dynamic cost = totalPoints * coinCostPercentage / 100 = 1000 * 0.1 = 100
      expect(result.items[0]?.dynamicCoinCost).toBe(100);
    });

    it("should calculate affordability when groupCoins provided", async () => {
      // Arrange
      const reward = createValidReward({ id: "reward-1", name: "Reward 1" });
      Effect.runSync(rewardRepo.create(reward));

      const input: ListRewardsInput = {
        tripId: "trip-123",
        groupCoins: 500,
      };

      // Act
      const result = await runUseCase(input, 1000);

      // Assert
      expect(result.items[0]?.canAfford).toBeDefined();
      // Dynamic cost is 100, group has 500, so canAfford should be true
      expect(result.items[0]?.canAfford).toBe(true);
    });

    it("should return canAfford as false when group cannot afford", async () => {
      // Arrange
      const reward = createValidReward({
        id: "reward-1",
        name: "Reward 1",
        availableQuantity: 5,
      });
      Effect.runSync(rewardRepo.create(reward));

      // With totalPoints=10000 and coinCostPercentage=10, dynamicCost=1000
      // Group has only 50 coins, so cannot afford
      const input: ListRewardsInput = {
        tripId: "trip-123",
        groupCoins: 50,
      };

      // Act
      const result = await runUseCase(input, 1000);

      // Assert
      expect(result.items[0]?.canAfford).toBe(false);
    });

    it("should handle pagination options", async () => {
      // Arrange
      for (let i = 0; i < 5; i++) {
        const reward = createValidReward({
          id: `reward-${i}`,
          name: `Reward ${i}`,
        });
        Effect.runSync(rewardRepo.create(reward));
      }

      const input: ListRewardsInput = {
        tripId: "trip-123",
        pagination: { limit: 3, offset: 0 },
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.limit).toBe(3);
      expect(result.hasMore).toBe(true);
    });

    it("should return empty list when no rewards exist", async () => {
      // Arrange
      const input: ListRewardsInput = {
        tripId: "empty-trip",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should include calculated fields in output", async () => {
      // Arrange
      const reward = createValidReward({ id: "reward-1", name: "Reward 1" });
      Effect.runSync(rewardRepo.create(reward));

      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      const item = result.items[0];
      expect(item?.id).toBeDefined();
      expect(item?.name).toBeDefined();
      expect(item?.description).toBeDefined();
      expect(item?.availableQuantity).toBeDefined();
      expect(item?.images).toBeDefined();
      expect(item?.primaryImage).toBeDefined();
      expect(item?.isHidden).toBeDefined();
      expect(item?.tripId).toBeDefined();
      expect(item?.createdAt).toBeInstanceOf(Date);
      expect(item?.updatedAt).toBeInstanceOf(Date);
      expect(item?.isInStock).toBeDefined();
      expect(item?.canBePurchased).toBeDefined();
    });
  });
});
