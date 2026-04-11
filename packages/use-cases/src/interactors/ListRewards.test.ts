import { describe, it, expect, mock } from "bun:test";
import { ListRewardsUseCase, type ListRewardsInput } from "./ListRewards";
import { Reward, RewardId } from "@mirai-app/domain";
import type {
  RewardRepository,
  TripPointsCalculator,
} from "../ports/RewardRepository";

describe("[UNIT] ListRewardsUseCase", () => {
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
    if (result.kind === "err") {
      throw new Error(`Failed to create test reward: ${result.error}`);
    }
    return result.value;
  };

  const createMockRewardRepo = (
    overrides?: Partial<RewardRepository>,
  ): RewardRepository => ({
    create: mock(() => Promise.resolve(createValidReward())),
    findById: mock(() => Promise.resolve(null)),
    findByTripId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    findVisibleByTripId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    update: mock(() => Promise.resolve(createValidReward())),
    delete: mock(() => Promise.resolve()),
    hasPurchases: mock(() => Promise.resolve(false)),
    getPurchaseCount: mock(() => Promise.resolve(0)),
    decrementQuantity: mock(() => Promise.resolve(createValidReward())),
    incrementQuantity: mock(() => Promise.resolve(createValidReward())),
    ...overrides,
  });

  const createMockPointsCalculator = (
    totalPoints: number = 1000,
  ): TripPointsCalculator => ({
    calculateTotalAvailablePoints: mock(() => Promise.resolve(totalPoints)),
  });

  describe("execute", () => {
    it("should list all visible rewards for a trip", async () => {
      // Arrange
      const mockRewards = [
        createValidReward({ id: "reward-1", name: "Reward 1" }),
        createValidReward({ id: "reward-2", name: "Reward 2" }),
      ];

      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: mockRewards,
            total: 2,
            limit: 10,
            offset: 0,
            hasMore: false,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.total).toBe(2);
        expect(result.value.hasMore).toBe(false);
      }
      expect(mockRepo.findVisibleByTripId).toHaveBeenCalledWith(
        "trip-123",
        undefined,
      );
      expect(
        pointsCalculator.calculateTotalAvailablePoints,
      ).toHaveBeenCalledWith("trip-123");
    });

    it("should include hidden rewards when includeHidden is true", async () => {
      // Arrange
      const hiddenReward = createValidReward({ id: "reward-hidden" });

      const mockRepo = createMockRewardRepo({
        findByTripId: mock(() =>
          Promise.resolve({
            items: [hiddenReward],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
        includeHidden: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toHaveLength(1);
      }
      expect(mockRepo.findByTripId).toHaveBeenCalledWith("trip-123", {
        includeHidden: true,
      });
    });

    it("should calculate dynamic coin costs", async () => {
      // Arrange
      const mockReward = createValidReward({
        id: "reward-1",
        name: "Reward 1",
      });

      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items[0].dynamicCoinCost).toBeDefined();
        expect(result.value.items[0].coinCostPercentage).toBe(10);
      }
    });

    it("should calculate affordability when groupCoins provided", async () => {
      // Arrange
      const mockReward = createValidReward({
        id: "reward-1",
        name: "Reward 1",
      });

      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
        groupCoins: 500,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items[0].canAfford).toBeDefined();
      }
    });

    it("should handle pagination options", async () => {
      // Arrange
      const mockRewards = Array.from({ length: 5 }, (_, i) =>
        createValidReward({ id: `reward-${i}`, name: `Reward ${i}` }),
      );

      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: mockRewards.slice(0, 3),
            total: 5,
            limit: 3,
            offset: 0,
            hasMore: true,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
        pagination: { limit: 3, offset: 0 },
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toHaveLength(3);
        expect(result.value.total).toBe(5);
        expect(result.value.limit).toBe(3);
        expect(result.value.hasMore).toBe(true);
      }
    });

    it("should return empty list when no rewards exist", async () => {
      // Arrange
      const mockRepo = createMockRewardRepo();
      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "empty-trip",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toHaveLength(0);
        expect(result.value.total).toBe(0);
      }
    });

    it("should include calculated fields in output", async () => {
      // Arrange
      const mockReward = createValidReward({
        id: "reward-1",
        name: "Reward 1",
      });

      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          }),
        ),
      });

      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const item = result.value.items[0];
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.availableQuantity).toBeDefined();
        expect(item.images).toBeDefined();
        expect(item.primaryImage).toBeDefined();
        expect(item.isHidden).toBeDefined();
        expect(item.tripId).toBeDefined();
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.updatedAt).toBeInstanceOf(Date);
        expect(item.isInStock).toBeDefined();
        expect(item.canBePurchased).toBeDefined();
      }
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockRepo = createMockRewardRepo({
        findVisibleByTripId: mock(() => Promise.reject(new Error("DB error"))),
      });
      const pointsCalculator = createMockPointsCalculator(1000);
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });

    it("should handle calculator errors", async () => {
      // Arrange
      const mockRepo = createMockRewardRepo();
      const pointsCalculator: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() =>
          Promise.reject(new Error("Calculator error")),
        ),
      };
      const useCase = new ListRewardsUseCase(mockRepo, pointsCalculator);
      const input: ListRewardsInput = {
        tripId: "trip-123",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("Calculator error");
    });
  });
});
