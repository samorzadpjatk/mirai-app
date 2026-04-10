import { describe, it, expect, beforeEach } from "bun:test";
import {
  PurchaseRewardUseCase,
  type PurchaseRewardInput,
} from "./PurchaseReward";
import { Reward, RewardPurchase, CoinAmount } from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";
import {
  InMemoryRewardRepository,
  InMemoryRewardPurchaseRepository,
} from "@mirai-app/adapters/gateways/in-memory";

// Simple in-memory implementations for testing
class InMemoryTripPointsCalculator implements TripPointsCalculator {
  private points = new Map<string, number>();

  setPoints(tripId: string, points: number): void {
    this.points.set(tripId, points);
  }

  async calculateTotalAvailablePoints(tripId: string): Promise<number> {
    return this.points.get(tripId) ?? 1000;
  }
}

class InMemoryGroupCoinsService implements GroupCoinsService {
  private balances = new Map<string, number>();
  private transactions: Array<{
    groupId: string;
    amount: number;
    reason: string;
    adminId: string;
  }> = [];

  reset(): void {
    this.balances.clear();
    this.transactions = [];
  }

  setBalance(groupId: string, balance: number): void {
    this.balances.set(groupId, balance);
  }

  async getBalance(groupId: string): Promise<number> {
    return this.balances.get(groupId) ?? 0;
  }

  async deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    const current = this.balances.get(groupId) ?? 0;
    if (current < amount) {
      throw new Error("Insufficient coins");
    }
    this.balances.set(groupId, current - amount);
    this.transactions.push({ groupId, amount: -amount, reason, adminId });
  }

  async addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    const current = this.balances.get(groupId) ?? 0;
    this.balances.set(groupId, current + amount);
    this.transactions.push({ groupId, amount, reason, adminId });
  }
}

class InMemoryTripAccessChecker implements TripAccessChecker {
  private leaders = new Map<string, { groupId: string; coins: number }>();
  private staff = new Set<string>();
  private endedTrips = new Set<string>();

  reset(): void {
    this.leaders.clear();
    this.staff.clear();
    this.endedTrips.clear();
  }

  setGroupLeader(userId: string, groupId: string, coins: number = 500): void {
    this.leaders.set(userId, { groupId, coins });
  }

  setStaff(userId: string): void {
    this.staff.add(userId);
  }

  setTripEnded(tripId: string): void {
    this.endedTrips.add(tripId);
  }

  async isGroupLeader(
    userId: string,
    tripId: string,
  ): Promise<{
    isLeader: boolean;
    groupId?: string;
    groupName?: string;
    coins?: number;
  }> {
    const leader = this.leaders.get(userId);
    if (leader) {
      return {
        isLeader: true,
        groupId: leader.groupId,
        groupName: "Test Group",
        coins: leader.coins,
      };
    }
    return { isLeader: false };
  }

  async isStaff(userId: string): Promise<boolean> {
    return this.staff.has(userId);
  }

  async hasTripEnded(tripId: string): Promise<boolean> {
    return this.endedTrips.has(tripId);
  }
}

async function runAsResult<T>(
  fn: () => Promise<T>,
): Promise<{ kind: "ok"; value: T } | { kind: "err"; error: string }> {
  try {
    const value = await fn();
    return { kind: "ok", value };
  } catch (error) {
    return {
      kind: "err",
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

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
    coinCostPercentage: 10,
    tripId: "trip-123",
    createdById: "admin-123",
  });
  return unwrap(result);
};

describe("[UNIT] PurchaseRewardUseCase", () => {
  let rewardRepo: InMemoryRewardRepository;
  let purchaseRepo: InMemoryRewardPurchaseRepository;
  let pointsCalc: InMemoryTripPointsCalculator;
  let coinsService: InMemoryGroupCoinsService;
  let accessChecker: InMemoryTripAccessChecker;
  let useCase: PurchaseRewardUseCase;

  beforeEach(() => {
    rewardRepo = new InMemoryRewardRepository();
    purchaseRepo = new InMemoryRewardPurchaseRepository();
    pointsCalc = new InMemoryTripPointsCalculator();
    coinsService = new InMemoryGroupCoinsService();
    accessChecker = new InMemoryTripAccessChecker();
    useCase = new PurchaseRewardUseCase(
      rewardRepo,
      purchaseRepo,
      pointsCalc,
      coinsService,
      accessChecker,
    );
  });

  describe("execute", () => {
    it("should successfully purchase reward", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await rewardRepo.create(mockReward);

      // Set up test data
      pointsCalc.setPoints("trip-123", 1000); // Total points for cost calculation
      coinsService.setBalance("group-123", 500); // Group has 500 coins
      accessChecker.setGroupLeader("user-123", "group-123", 500);

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.rewardId).toBe(mockReward.id);
        expect(result.value.groupId).toBe("group-123");
        expect(result.value.quantity).toBe(2);
        expect(result.value.totalCost).toBe(200); // 2 * (10% of 1000)
        expect(result.value.status).toBe("BOUGHT");
      }

      // Verify reward quantity was decremented
      const updatedReward = await rewardRepo.findById(mockReward.id);
      expect(updatedReward?.availableQuantity).toBe(8); // 10 - 2

      // Verify coins were deducted
      const remainingCoins = await coinsService.getBalance("group-123");
      expect(remainingCoins).toBe(300); // 500 - 200

      // Verify purchase was recorded
      const purchases = await purchaseRepo.findByRewardId(mockReward.id);
      expect(purchases.total).toBe(1);
    });

    it("should reject purchase when reward not found", async () => {
      const input: PurchaseRewardInput = {
        rewardId:
          "nonexistent-id" as unknown as import("@mirai-app/domain").RewardId,
        quantity: 2,
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });

    it("should reject purchase when user is not group leader", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await rewardRepo.create(mockReward);

      pointsCalc.setPoints("trip-123", 1000);
      // Don't set user as group leader

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });

    it("should reject purchase when insufficient quantity", async () => {
      // Arrange
      const mockReward = createValidReward(5); // Only 5 available
      await rewardRepo.create(mockReward);

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 10, // Trying to buy 10 when only 5 available
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });

    it("should reject purchase when insufficient coins", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await rewardRepo.create(mockReward);

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 50); // Only 50 coins
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2, // Need 200 coins (2 * 10% of 1000)
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });

    it("should reject purchase when trip has ended", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await rewardRepo.create(mockReward);

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");
      accessChecker.setTripEnded("trip-123"); // Trip has ended

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });

    it("should reject purchase when reward is hidden", async () => {
      // Arrange - create a hidden reward
      const hiddenRewardResult = Reward.create({
        name: "Hidden Reward",
        description: "A hidden reward",
        availableQuantity: 10,
        coinCostPercentage: 10,
        tripId: "trip-123",
        createdById: "admin-123",
        isHidden: true,
      });
      const hiddenReward = unwrap(hiddenRewardResult);
      await rewardRepo.create(hiddenReward);

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: hiddenReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Unexpected error");
      }
    });
  });
});
