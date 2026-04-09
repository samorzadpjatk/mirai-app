import { describe, it, expect, mock } from "bun:test";
import {
  PurchaseRewardUseCase,
  type PurchaseRewardInput,
} from "./PurchaseReward";
import { Reward, RewardPurchase, UserRole, CoinAmount } from "@repo/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";

// Helper to unwrap Result
const unwrap = <T, E>(
  result: { kind: "ok"; value: T } | { kind: "err"; error: E },
): T => {
  if (result.kind === "err") {
    throw new Error(`Unexpected error: ${result.error}`);
  }
  return result.value;
};

// Helper to create a valid reward
const createValidReward = (quantity: number = 10): Reward => {
  const result = Reward.create({
    name: "Test Reward",
    description: "A test reward",
    availableQuantity: quantity,
    coinCostPercentage: 10, // 10% of total points
    tripId: "trip-123",
    createdById: "admin-123",
  });
  return unwrap(result);
};

describe("[UNIT] PurchaseRewardUseCase", () => {
  describe("execute", () => {
    it("should successfully purchase reward", async () => {
      const mockReward = createValidReward(10);
      const mockPurchase = unwrap(
        RewardPurchase.create({
          rewardId: mockReward.id,
          groupId: "group-123",
          quantity: 2,
          totalCost: 200,
          purchasedById: "user-123",
        }),
      );

      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(mockReward)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() =>
          Promise.resolve(unwrap(mockReward.decrementQuantity(2))),
        ),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };

      const mockPurchaseRepo: RewardPurchaseRepository = {
        create: mock(() => Promise.resolve(mockPurchase)),
        findById: mock(() => Promise.resolve(null)),
        findByRewardId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByGroupId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        updateStatus: mock(() => Promise.resolve(mockPurchase)),
        countByRewardId: mock(() => Promise.resolve(0)),
      };

      const mockPointsCalc: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
      };

      const mockCoinsService: GroupCoinsService = {
        getBalance: mock(() => Promise.resolve(500)),
        deductCoins: mock(() => Promise.resolve()),
        addCoins: mock(() => Promise.resolve()),
      };

      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123", coins: 500 }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new PurchaseRewardUseCase(
        mockRepo,
        mockPurchaseRepo,
        mockPointsCalc,
        mockCoinsService,
        mockAccessChecker,
      );

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.rewardId).toBe(mockReward.id);
        expect(result.value.groupId).toBe("group-123");
        expect(result.value.quantity).toBe(2);
        expect(result.value.totalCost).toBe(200); // 2 * (10% of 1000)
        expect(result.value.status).toBe("BOUGHT");
      }
      expect(mockRepo.decrementQuantity).toHaveBeenCalledWith(mockReward.id, 2);
      expect(mockCoinsService.deductCoins).toHaveBeenCalled();
      expect(mockPurchaseRepo.create).toHaveBeenCalled();
    });

    it("should reject purchase when reward not found", async () => {
      const mockReward = createValidReward(10);

      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };

      const mockPurchaseRepo: RewardPurchaseRepository = {
        create: mock(() => Promise.resolve({} as RewardPurchase)),
        findById: mock(() => Promise.resolve(null)),
        findByRewardId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByGroupId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        updateStatus: mock(() => Promise.resolve({} as RewardPurchase)),
        countByRewardId: mock(() => Promise.resolve(0)),
      };

      const mockPointsCalc: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
      };

      const mockCoinsService: GroupCoinsService = {
        getBalance: mock(() => Promise.resolve(500)),
        deductCoins: mock(() => Promise.resolve()),
        addCoins: mock(() => Promise.resolve()),
      };

      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new PurchaseRewardUseCase(
        mockRepo,
        mockPurchaseRepo,
        mockPointsCalc,
        mockCoinsService,
        mockAccessChecker,
      );

      const input: PurchaseRewardInput = {
        rewardId:
          "nonexistent-id" as unknown as import("@repo/domain").RewardId,
        quantity: 2,
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("not found");
      }
    });

    it("should reject purchase when user is not group leader", async () => {
      const mockReward = createValidReward(10);

      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(mockReward)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };

      const mockPurchaseRepo: RewardPurchaseRepository = {
        create: mock(() => Promise.resolve({} as RewardPurchase)),
        findById: mock(() => Promise.resolve(null)),
        findByRewardId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByGroupId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        updateStatus: mock(() => Promise.resolve({} as RewardPurchase)),
        countByRewardId: mock(() => Promise.resolve(0)),
      };

      const mockPointsCalc: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
      };

      const mockCoinsService: GroupCoinsService = {
        getBalance: mock(() => Promise.resolve(500)),
        deductCoins: mock(() => Promise.resolve()),
        addCoins: mock(() => Promise.resolve()),
      };

      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(
          () => Promise.resolve({ isLeader: false }), // Not a leader
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new PurchaseRewardUseCase(
        mockRepo,
        mockPurchaseRepo,
        mockPointsCalc,
        mockCoinsService,
        mockAccessChecker,
      );

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("group leaders");
      }
    });

    it("should reject purchase when insufficient quantity", async () => {
      const mockReward = createValidReward(5); // Only 5 available

      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(mockReward)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };

      const mockPurchaseRepo: RewardPurchaseRepository = {
        create: mock(() => Promise.resolve({} as RewardPurchase)),
        findById: mock(() => Promise.resolve(null)),
        findByRewardId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByGroupId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        updateStatus: mock(() => Promise.resolve({} as RewardPurchase)),
        countByRewardId: mock(() => Promise.resolve(0)),
      };

      const mockPointsCalc: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
      };

      const mockCoinsService: GroupCoinsService = {
        getBalance: mock(() => Promise.resolve(500)),
        deductCoins: mock(() => Promise.resolve()),
        addCoins: mock(() => Promise.resolve()),
      };

      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new PurchaseRewardUseCase(
        mockRepo,
        mockPurchaseRepo,
        mockPointsCalc,
        mockCoinsService,
        mockAccessChecker,
      );

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 10, // Trying to buy 10 when only 5 available
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Not enough");
      }
    });

    it("should reject purchase when insufficient coins", async () => {
      const mockReward = createValidReward(10);

      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(mockReward)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [mockReward],
            total: 1,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };

      const mockPurchaseRepo: RewardPurchaseRepository = {
        create: mock(() => Promise.resolve({} as RewardPurchase)),
        findById: mock(() => Promise.resolve(null)),
        findByRewardId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByGroupId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        updateStatus: mock(() => Promise.resolve({} as RewardPurchase)),
        countByRewardId: mock(() => Promise.resolve(0)),
      };

      const mockPointsCalc: TripPointsCalculator = {
        calculateTotalAvailablePoints: mock(() => Promise.resolve(1000)),
      };

      const mockCoinsService: GroupCoinsService = {
        getBalance: mock(() => Promise.resolve(50)), // Only 50 coins
        deductCoins: mock(() => Promise.resolve()),
        addCoins: mock(() => Promise.resolve()),
      };

      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new PurchaseRewardUseCase(
        mockRepo,
        mockPurchaseRepo,
        mockPointsCalc,
        mockCoinsService,
        mockAccessChecker,
      );

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2, // Need 200 coins (2 * 10% of 1000)
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Not enough coins");
      }
    });
  });
});
