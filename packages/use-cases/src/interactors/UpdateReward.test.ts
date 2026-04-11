import { describe, it, expect, mock } from "bun:test";
import { UpdateRewardUseCase, type UpdateRewardInput } from "./UpdateReward";
import { Reward, RewardId } from "@mirai-app/domain";
import type { RewardRepository } from "../ports/RewardRepository";

describe("[UNIT] UpdateRewardUseCase", () => {
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
    if (result.kind === "err") {
      throw new Error(`Failed to create test reward: ${result.error}`);
    }
    return result.value;
  };

  const createMockRepo = (
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

  describe("execute", () => {
    it("should update reward name successfully", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({
        id: "reward-456",
        name: "Old Name",
      });
      const updatedReward = createValidReward({
        id: "reward-456",
        name: "New Name",
      });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(updatedReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("New Name");
        expect(result.value.id).toBe("reward-456");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith(rewardId);
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update reward description", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(existingReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        description: "Updated description",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update available quantity", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({
        id: "reward-456",
        availableQuantity: 10,
      });
      const updatedReward = createValidReward({
        id: "reward-456",
        availableQuantity: 20,
      });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(updatedReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        availableQuantity: 20,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.availableQuantity).toBe(20);
      }
    });

    it("should update images", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(existingReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        images: [
          "https://example.com/image1.png",
          "https://example.com/image2.png",
        ],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update coin cost percentage", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(existingReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        coinCostPercentage: 25,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should return error when reward not found", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("non-existent");

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Reward not found");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when validation fails", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        name: "", // Invalid empty name
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
    });

    it("should handle repository errors", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.reject(new Error("Update failed"))),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        name: "New Name",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("Update failed");
    });

    it("should include calculated fields in output", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");

      const existingReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingReward)),
        update: mock(() => Promise.resolve(existingReward)),
      });

      const useCase = new UpdateRewardUseCase(mockRepo);
      const input: UpdateRewardInput = {
        rewardId,
        name: "Updated Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isInStock).toBeDefined();
        expect(result.value.canBePurchased).toBeDefined();
        expect(result.value.primaryImage).toBeDefined();
        expect(result.value.tripId).toBeDefined();
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
