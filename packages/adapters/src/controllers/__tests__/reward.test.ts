import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
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
  TripId,
} from "@mirai-app/domain";

// Valid UUIDs for testing
const REWARD_ID = RewardId.unsafeCreate("550e8400-e29b-41d4-a716-446655440000");
const TRIP_ID = TripId.unsafeCreate("550e8400-e29b-41d4-a716-446655440001");
const USER_ID = "550e8400-e29b-41d4-a716-446655440002";
const GROUP_ID = "550e8400-e29b-41d4-a716-446655440003";
const PURCHASE_ID = "550e8400-e29b-41d4-a716-446655440004";

// Mock Reward
const createMockReward = (overrides?: Partial<Reward>): Reward => {
  // Create base coinCostPercentage that survives spreading
  const baseCoinCostPercentage = { toNumber: () => 50, value: 50 };

  // Ensure overrides.coinCostPercentage is always a proper object
  const safeOverrides = overrides ? { ...overrides } : {};
  if (
    safeOverrides.coinCostPercentage === undefined ||
    safeOverrides.coinCostPercentage === null
  ) {
    // If coinCostPercentage is not provided, use the base one
    // If it's provided as a number, convert it to object
    safeOverrides.coinCostPercentage = baseCoinCostPercentage;
  }

  const reward = {
    id: REWARD_ID,
    name: "Test Reward",
    description: "Test description",
    availableQuantity: 10,
    coinCostPercentage: baseCoinCostPercentage,
    images: [],
    getPrimaryImage: () => null,
    isHidden: false,
    tripId: TRIP_ID,
    createdById: USER_ID,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isInStock: () => true,
    canBePurchased: () => true,
    canPurchaseQuantity: () => true,
    calculateDynamicCoinCost: () => baseCoinCostPercentage,
    canAfford: () => Effect.succeed(true),
    calculateTotalCost: () => Effect.succeed({ toNumber: () => 50, value: 50 }),
    update: function (props: unknown) {
      // Return a complete mock reward with all required properties
      const spread = { ...this, ...(props as object), updatedAt: new Date() };
      // Ensure coinCostPercentage always has toNumber
      if (
        !spread.coinCostPercentage ||
        typeof spread.coinCostPercentage.toNumber !== "function"
      ) {
        spread.coinCostPercentage = baseCoinCostPercentage;
      }
      return Effect.succeed(createMockReward(spread as Partial<Reward>));
    },
    hide: function () {
      return createMockReward({ ...this, isHidden: true } as Partial<Reward>);
    },
    unhide: function () {
      return createMockReward({ ...this, isHidden: false } as Partial<Reward>);
    },
    ...safeOverrides,
  };

  return reward as unknown as Reward;
};

describe("[UNIT] RewardController", () => {
  let controller: RewardController;
  let mockRewardRepository: RewardRepository;
  let mockPurchaseRepository: RewardPurchaseRepository;
  let mockPointsCalculator: TripPointsCalculator;
  let mockCoinsService: GroupCoinsService;
  let mockAccessChecker: TripAccessChecker;

  beforeEach(() => {
    mockRewardRepository = {
      findById: mock(() => Effect.succeed(createMockReward())),
      findByTripId: mock(() =>
        Effect.succeed({
          items: [createMockReward()],
          total: 1,
          limit: 30,
          offset: 0,
          hasMore: false,
        }),
      ),
      findVisibleByTripId: mock(() =>
        Effect.succeed({
          items: [createMockReward()],
          total: 1,
          limit: 30,
          offset: 0,
          hasMore: false,
        }),
      ),
      create: mock((reward: Reward) => Effect.succeed(reward)),
      update: mock((reward: Reward) => Effect.succeed(reward)),
      delete: mock(() => Effect.succeed(undefined)),
      hasPurchases: mock(() => Effect.succeed(false)),
      getPurchaseCount: mock(() => Effect.succeed(0)),
      incrementQuantity: mock(() => Effect.succeed(createMockReward())),
      decrementQuantity: mock(() => Effect.succeed(createMockReward())),
      findAll: mock(() => Effect.succeed([])),
      findByStatus: mock(() => Effect.succeed([])),
    } as unknown as RewardRepository;

    mockPurchaseRepository = {
      findById: mock(() =>
        Effect.succeed({
          id: PURCHASE_ID,
          rewardId: REWARD_ID,
          userId: USER_ID,
          quantity: 1,
          status: RewardPurchaseStatus.PENDING,
          totalCost: { toNumber: () => 50 },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as RewardPurchase),
      ),
      findByRewardId: mock(() => Effect.succeed({ items: [], total: 0 })),
      findByUserId: mock(() => Effect.succeed([])),
      findByGroupId: mock(() => Effect.succeed({ items: [], total: 0 })),
      findByTripId: mock(() => Effect.succeed({ items: [], total: 0 })),
      create: mock((data) =>
        Effect.succeed({
          id: PURCHASE_ID,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as RewardPurchase),
      ),
      updateStatus: mock((id, status) =>
        Effect.succeed({
          id,
          status,
          updatedAt: new Date(),
        } as unknown as RewardPurchase),
      ),
      countByRewardId: mock(() => Effect.succeed(0)),
    } as unknown as RewardPurchaseRepository;

    mockPointsCalculator = {
      calculateTotalAvailablePoints: mock(() => Effect.succeed(1000)),
    } as unknown as TripPointsCalculator;

    mockCoinsService = {
      getBalance: mock(() => Effect.succeed(500)),
      deductCoins: mock(() => Effect.succeed(undefined)),
      addCoins: mock(() => Effect.succeed(undefined)),
    } as unknown as GroupCoinsService;

    mockAccessChecker = {
      isGroupLeader: mock(() =>
        Effect.succeed({ isLeader: true, groupId: GROUP_ID }),
      ),
      isStaff: mock(() => Effect.succeed(true)),
      hasTripEnded: mock(() => Effect.succeed(false)),
      hasTripStarted: mock(() => Effect.succeed(true)),
      isParticipant: mock(() => Effect.succeed(true)),
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
      const result = await controller.getById({ id: REWARD_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(REWARD_ID);
      }
    });

    it("should return error when reward not found", async () => {
      mockRewardRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: REWARD_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTrip", () => {
    it("should return rewards for trip", async () => {
      const result = await controller.getByTrip({ tripId: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
      }
    });
  });

  describe("getByTripAdmin", () => {
    it("should return all rewards including hidden", async () => {
      const result = await controller.getByTripAdmin({ tripId: TRIP_ID });

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
        tripId: TRIP_ID,
        createdById: USER_ID,
        creatorRole: "ADMIN" as const,
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
        tripId: TRIP_ID,
        createdById: USER_ID,
        creatorRole: "ADMIN" as const,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update reward", async () => {
      const input = {
        rewardId: REWARD_ID,
        name: "Updated Reward",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("setHidden", () => {
    it("should hide reward", async () => {
      const input = {
        rewardId: REWARD_ID,
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
        rewardId: REWARD_ID,
        isHidden: false,
      };

      const result = await controller.setHidden(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete reward", async () => {
      const result = await controller.delete({ rewardId: REWARD_ID });

      expect(result.success).toBe(true);
    });

    it("should return error when reward has purchases", async () => {
      mockRewardRepository.hasPurchases = mock(() => Effect.succeed(true));

      const result = await controller.delete({ rewardId: REWARD_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("purchase", () => {
    it("should purchase reward", async () => {
      const input = {
        rewardId: REWARD_ID,
        quantity: 1,
        userId: USER_ID,
      };

      const result = await controller.purchase(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid quantity", async () => {
      const result = await controller.purchase({
        rewardId: REWARD_ID,
        quantity: 0,
        userId: USER_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getTotalAvailablePoints", () => {
    it("should return total points", async () => {
      const result = await controller.getTotalAvailablePoints({
        tripId: TRIP_ID,
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
        tripId: TRIP_ID,
        userId: USER_ID,
        isStaff: true,
      };

      const result = await controller.getPurchaseHistory(input);

      expect(result.success).toBe(true);
    });
  });
});
