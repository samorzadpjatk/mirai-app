import { describe, it, expect, mock } from "bun:test";
import { DeleteRewardUseCase, type DeleteRewardInput } from "./DeleteReward";
import { Reward, RewardId } from "@mirai-app/domain";
import type { RewardRepository } from "../ports/RewardRepository";

describe("[UNIT] DeleteRewardUseCase", () => {
  // Helper to create a valid reward
  const createValidReward = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string;
    }>,
  ): Reward => {
    const rewardId = RewardId.unsafeCreate(overrides?.id ?? "reward-123");

    const result = Reward.create({
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
    it("should delete reward successfully when no purchases exist", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-456");
      const mockReward = createValidReward({ id: "reward-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockReward)),
        hasPurchases: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.resolve()),
      });

      const useCase = new DeleteRewardUseCase(mockRepo);
      const input: DeleteRewardInput = {
        rewardId,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.success).toBe(true);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith(rewardId);
      expect(mockRepo.hasPurchases).toHaveBeenCalledWith(rewardId);
      expect(mockRepo.delete).toHaveBeenCalledWith(rewardId);
    });

    it("should return error when reward not found", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("non-existent");

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new DeleteRewardUseCase(mockRepo);
      const input: DeleteRewardInput = {
        rewardId,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Reward not found");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should return error when reward has purchases", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-with-purchases");
      const mockReward = createValidReward({ id: "reward-with-purchases" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockReward)),
        hasPurchases: mock(() => Promise.resolve(true)),
      });

      const useCase = new DeleteRewardUseCase(mockRepo);
      const input: DeleteRewardInput = {
        rewardId,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Cannot delete reward with existing purchases",
        );
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should handle repository errors during find", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-123");

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new DeleteRewardUseCase(mockRepo);
      const input: DeleteRewardInput = {
        rewardId,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });

    it("should handle repository errors during delete", async () => {
      // Arrange
      const rewardId = RewardId.unsafeCreate("reward-123");
      const mockReward = createValidReward();

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockReward)),
        hasPurchases: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.reject(new Error("Delete failed"))),
      });

      const useCase = new DeleteRewardUseCase(mockRepo);
      const input: DeleteRewardInput = {
        rewardId,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("Delete failed");
    });
  });
});
