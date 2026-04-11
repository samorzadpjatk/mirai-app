import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RewardController } from "../reward";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "@mirai-app/use-cases";
import {
  Reward,
  RewardId,
  RewardPurchase,
  RewardPurchaseStatus,
} from "@mirai-app/domain";

// Mock Reward
const createMockReward = (overrides?: Partial<Reward>): Reward =>
  ({
    id: "reward-123" as RewardId,
    name: "Test Reward",
    description: "Test description",
    availableQuantity: 10,
    coinCostPercentage: { toNumber: () => 50 },
    images: [],
    getPrimaryImage: () => null,
    isHidden: false,
    tripId: "trip-123",
    createdById: "user-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isInStock: () => true,
    canBePurchased: () => true,
    hide: function () {
      return { ...this, isHidden: true };
    },
    unhide: function () {
      return { ...this, isHidden: false };
    },
    ...overrides,
  }) as unknown as Reward;

describe("[UNIT] RewardController", () => {
  let controller: RewardController;
  let mockRewardRepository: RewardRepository;
  let mockPurchaseRepository: RewardPurchaseRepository;
  let mockPointsCalculator: TripPointsCalculator;
  let mockCoinsService: GroupCoinsService;
  let mockAccessChecker: TripAccessChecker;

  beforeEach(() => {
    mockRewardRepository = {
      findById: mock(() => Promise.resolve(createMockReward())),
      findByTripId: mock(() =>
        Promise.resolve({ items: [createMockReward()], total: 1 }),
      ),
      findVisibleByTripId: mock(() =>
        Promise.resolve({ items: [createMockReward()], total: 1 }),
      ),
      create: mock((reward: Reward) => Promise.resolve(reward)),
      update: mock((reward: Reward) => Promise.resolve(reward)),
      delete: mock(() => Promise.resolve()),
      hasPurchases: mock(() => Promise.resolve(false)),
      getPurchaseCount: mock(() => Promise.resolve(0)),
      incrementQuantity: mock((id: RewardId, amount: number) =>
        Promise.resolve(createMockReward()),
      ),
      decrementQuantity: mock((id: RewardId, amount: number) =>
        Promise.resolve(createMockReward()),
      ),
    } as unknown as RewardRepository;

    mockPurchaseRepository = {
      findById: mock(() => Promise.resolve({} as RewardPurchase)),
      findByRewardId: mock(() => Promise.resolve({ items: [], total: 0 })),
      findByGroupId: mock(() => Promise.resolve({ items: [], total: 0 })),
      findByTripId: mock(() => Promise.resolve({ items: [], total: 0 })),
      create: mock(() => Promise.resolve({} as RewardPurchase)),
      updateStatus: mock(() => Promise.resolve({} as RewardPurchase)),
      countByRewardId: mock(() => Promise.resolve(0)),
    } as unknown as RewardPurchaseRepository;

    mockPointsCalculator = {
      calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
    } as unknown as TripPointsCalculator;

    mockCoinsService = {
      getBalance: mock(() => Promise.resolve(500)),
      deductCoins: mock(() => Promise.resolve()),
      addCoins: mock(() => Promise.resolve()),
    } as unknown as GroupCoinsService;

    mockAccessChecker = {
      isGroupLeader: mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      ),
      isStaff: mock(() => Promise.resolve(true)),
      hasTripEnded: mock(() => Promise.resolve(false)),
    } as unknown as TripAccessChecker;

    controller = new RewardController(
      mockRewardRepository,
      mockPurchaseRepository,
      mockPointsCalculator,
      mockCoinsService,
      mockAccessChecker,
    );
  });

  describe("getById", () => {
    it("should return reward by ID", async () => {
      const result = await controller.getById({ id: "reward-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("reward-123");
      }
    });

    it("should return error when reward not found", async () => {
      mockRewardRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "reward-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTrip", () => {
    it("should return rewards for trip", async () => {
      const result = await controller.getByTrip({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
      }
    });
  });

  describe("getByTripAdmin", () => {
    it("should return all rewards including hidden", async () => {
      const result = await controller.getByTripAdmin({ tripId: "trip-123" });

      expect(result.success).toBe(true);
    });
  });

  describe("create", () => {
    it("should create reward with valid input", async () => {
      const input = {
        name: "New Reward",
        description: "New description",
        availableQuantity: 10,
        coinCostPercentage: 50,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: "ADMIN",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Reward");
      }
    });

    it("should return error for invalid input", async () => {
      const result = await controller.create({
        name: "", // Empty name
        description: "Test",
        availableQuantity: 10,
        coinCostPercentage: 50,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: "ADMIN",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update reward", async () => {
      const input = {
        rewardId: "reward-123",
        name: "Updated Reward",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("setHidden", () => {
    it("should hide reward", async () => {
      const input = {
        rewardId: "reward-123",
        isHidden: true,
      };

      const result = await controller.setHidden(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(true);
      }
    });

    it("should unhide reward", async () => {
      const input = {
        rewardId: "reward-123",
        isHidden: false,
      };

      const result = await controller.setHidden(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete reward", async () => {
      const result = await controller.delete({ rewardId: "reward-123" });

      expect(result.success).toBe(true);
    });

    it("should return error when reward has purchases", async () => {
      mockRewardRepository.hasPurchases = mock(() => Promise.resolve(true));

      const result = await controller.delete({ rewardId: "reward-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("purchase", () => {
    it("should purchase reward", async () => {
      const input = {
        rewardId: "reward-123",
        quantity: 1,
        userId: "user-123",
      };

      const result = await controller.purchase(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid quantity", async () => {
      const result = await controller.purchase({
        rewardId: "reward-123",
        quantity: 0,
        userId: "user-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getTotalAvailablePoints", () => {
    it("should return total points", async () => {
      const result = await controller.getTotalAvailablePoints({
        tripId: "trip-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPoints).toBe(1000);
      }
    });
  });

  describe("getPurchaseHistory", () => {
    it("should return purchase history", async () => {
      const input = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await controller.getPurchaseHistory(input);

      expect(result.success).toBe(true);
    });
  });
});
