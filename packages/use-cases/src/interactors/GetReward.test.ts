import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetRewardUseCase, type GetRewardInput } from "./GetReward";
import type { RewardRepository } from "../ports/RewardRepository";
import type { Reward, RewardId } from "@mirai-app/domain";

// Mock Reward domain object
const createMockReward = (overrides?: Partial<Reward>): Reward =>
  ({
    id: "reward-123",
    name: "Test Reward",
    description: "A test reward",
    availableQuantity: 10,
    coinCostPercentage: { toNumber: () => 50 },
    images: ["image1.jpg", "image2.jpg"],
    getPrimaryImage: () => "image1.jpg",
    isHidden: false,
    tripId: "trip-123",
    createdById: "user-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    isInStock: () => true,
    canBePurchased: () => true,
    ...overrides,
  }) as Reward;

describe("[UNIT] GetRewardUseCase", () => {
  let useCase: GetRewardUseCase;
  let mockRewardRepository: RewardRepository;

  beforeEach(() => {
    mockRewardRepository = {
      findById: mock(() => Promise.resolve(createMockReward())),
      getPurchaseCount: mock(() => Promise.resolve(5)),
    } as unknown as RewardRepository;

    useCase = new GetRewardUseCase(mockRewardRepository);
  });

  describe("execute", () => {
    it("should return reward with purchase count when found", async () => {
      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("reward-123");
        expect(result.value.name).toBe("Test Reward");
        expect(result.value.description).toBe("A test reward");
        expect(result.value.availableQuantity).toBe(10);
        expect(result.value.coinCostPercentage).toBe(50);
        expect(result.value.images).toEqual(["image1.jpg", "image2.jpg"]);
        expect(result.value.primaryImage).toBe("image1.jpg");
        expect(result.value.isHidden).toBe(false);
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.createdById).toBe("user-123");
        expect(result.value.isInStock).toBe(true);
        expect(result.value.canBePurchased).toBe(true);
        expect(result.value.purchaseCount).toBe(5);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should return error when reward not found", async () => {
      mockRewardRepository.findById = mock(() => Promise.resolve(null));
      const input: GetRewardInput = { rewardId: "nonexistent" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Reward not found");
      }
    });

    it("should return reward with zero purchase count", async () => {
      mockRewardRepository.getPurchaseCount = mock(() => Promise.resolve(0));
      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.purchaseCount).toBe(0);
      }
    });

    it("should handle hidden rewards", async () => {
      mockRewardRepository.findById = mock(() =>
        Promise.resolve(createMockReward({ isHidden: true })),
      );
      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isHidden).toBe(true);
      }
    });

    it("should handle rewards with null primary image", async () => {
      mockRewardRepository.findById = mock(() =>
        Promise.resolve(
          createMockReward({
            images: [],
            getPrimaryImage: () => null,
          }),
        ),
      );
      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.primaryImage).toBeNull();
      }
    });

    it("should handle out of stock rewards", async () => {
      mockRewardRepository.findById = mock(() =>
        Promise.resolve(
          createMockReward({
            availableQuantity: 0,
            isInStock: () => false,
            canBePurchased: () => false,
          }),
        ),
      );
      const input: GetRewardInput = { rewardId: "reward-123" as RewardId };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isInStock).toBe(false);
        expect(result.value.canBePurchased).toBe(false);
      }
    });
  });
});
