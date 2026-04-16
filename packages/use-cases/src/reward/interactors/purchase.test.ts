import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  purchaseRewardUseCase,
  type PurchaseRewardInput,
  RewardNotFoundError,
  TripEndedError,
  RewardHiddenError,
  InsufficientQuantityError,
  NotGroupLeaderError,
  InsufficientCoinsError,
} from "./purchase";
import {
  Reward,
  RewardPurchase,
  CoinAmount,
  RewardId,
} from "@mirai-app/domain";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
  type PaginatedResult,
} from "../ports/gateway";
import {
  InMemoryRewardGateway,
  InMemoryRewardPurchaseGateway,
} from "@mirai-app/adapters";

// Simple in-memory implementations for testing
class InMemoryTripPointsCalculator {
  private points = new Map<string, number>();

  setPoints(tripId: string, points: number): void {
    this.points.set(tripId, points);
  }

  calculateTotalAvailablePoints(
    tripId: string,
  ): Effect.Effect<number, never, never> {
    return Effect.succeed(this.points.get(tripId) ?? 1000);
  }
}

class InMemoryGroupCoinsService {
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

  getBalance(groupId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(this.balances.get(groupId) ?? 0);
  }

  deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, Error, never> {
    const current = this.balances.get(groupId) ?? 0;
    if (current < amount) {
      return Effect.fail(new Error("Insufficient coins"));
    }
    this.balances.set(groupId, current - amount);
    this.transactions.push({ groupId, amount: -amount, reason, adminId });
    return Effect.succeed(undefined);
  }

  addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, never, never> {
    const current = this.balances.get(groupId) ?? 0;
    this.balances.set(groupId, current + amount);
    this.transactions.push({ groupId, amount, reason, adminId });
    return Effect.succeed(undefined);
  }
}

class InMemoryTripAccessChecker {
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

  isGroupLeader(
    userId: string,
    tripId: string,
  ): Effect.Effect<
    {
      isLeader: boolean;
      groupId?: string;
      groupName?: string;
      coins?: number;
    },
    never,
    never
  > {
    const leader = this.leaders.get(userId);
    if (leader) {
      return Effect.succeed({
        isLeader: true,
        groupId: leader.groupId,
        groupName: "Test Group",
        coins: leader.coins,
      });
    }
    return Effect.succeed({ isLeader: false });
  }

  isStaff(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(this.staff.has(userId));
  }

  hasTripEnded(tripId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(this.endedTrips.has(tripId));
  }
}

// Helper to unwrap Effect or Result
const unwrap = <T>(effect: Effect.Effect<T, unknown, never>): T => {
  return Effect.runSync(effect);
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

// Helper to build use case program without running
const buildPurchaseRewardProgram = (
  input: PurchaseRewardInput,
  deps: {
    rewardGateway: InMemoryRewardGateway;
    purchaseGateway: InMemoryRewardPurchaseGateway;
    pointsCalc: InMemoryTripPointsCalculator;
    coinsService: InMemoryGroupCoinsService;
    accessChecker: InMemoryTripAccessChecker;
  },
) => {
  return purchaseRewardUseCase(input).pipe(
    Effect.provideService(RewardGatewayTag, {
      create: (reward: Reward) => deps.rewardGateway.create(reward),
      findById: (id: RewardId) => deps.rewardGateway.findById(id),
      findByTripId: (tripId: string, options?) =>
        deps.rewardGateway.findByTripId(tripId, options),
      findVisibleByTripId: (tripId: string, options?) =>
        deps.rewardGateway.findVisibleByTripId(tripId, options),
      update: (reward: Reward) => deps.rewardGateway.update(reward),
      delete: (id: RewardId) => deps.rewardGateway.delete(id),
      hasPurchases: (id: RewardId) => deps.rewardGateway.hasPurchases(id),
      getPurchaseCount: (id: RewardId) =>
        deps.rewardGateway.getPurchaseCount(id),
      decrementQuantity: (id: RewardId, amount: number) =>
        deps.rewardGateway.decrementQuantity(id, amount),
      incrementQuantity: (id: RewardId, amount: number) =>
        deps.rewardGateway.incrementQuantity(id, amount),
    }),
    Effect.provideService(RewardPurchaseGatewayTag, {
      create: (purchase: RewardPurchase) =>
        deps.purchaseGateway.create(purchase),
      findById: (id: string) => deps.purchaseGateway.findById(id),
      findByRewardId: (rewardId: RewardId, options?) =>
        deps.purchaseGateway.findByRewardId(rewardId, options),
      findByGroupId: (groupId: string, options?) =>
        deps.purchaseGateway.findByGroupId(groupId, options),
      findByTripId: (tripId: string, options?) =>
        deps.purchaseGateway.findByTripId(tripId, options),
      updateStatus: (
        id: string,
        status: string,
        updatedById: string,
        collectionMethod?,
      ) =>
        deps.purchaseGateway.updateStatus(
          id,
          status,
          updatedById,
          collectionMethod,
        ),
      countByRewardId: (rewardId: RewardId) =>
        deps.purchaseGateway.countByRewardId(rewardId),
    }),
    Effect.provideService(TripPointsCalculatorTag, {
      calculateTotalAvailablePoints: (tripId: string) =>
        deps.pointsCalc.calculateTotalAvailablePoints(tripId),
    }),
    Effect.provideService(GroupCoinsServiceTag, {
      getBalance: (groupId: string) => deps.coinsService.getBalance(groupId),
      deductCoins: (
        groupId: string,
        amount: number,
        reason: string,
        adminId: string,
      ) => deps.coinsService.deductCoins(groupId, amount, reason, adminId),
      addCoins: (
        groupId: string,
        amount: number,
        reason: string,
        adminId: string,
      ) => deps.coinsService.addCoins(groupId, amount, reason, adminId),
    }),
    Effect.provideService(TripAccessCheckerTag, {
      isGroupLeader: (userId: string, tripId: string) =>
        deps.accessChecker.isGroupLeader(userId, tripId),
      isStaff: (userId: string) => deps.accessChecker.isStaff(userId),
      hasTripEnded: (tripId: string) => deps.accessChecker.hasTripEnded(tripId),
    }),
  );
};

// Helper to run use case with Effect
const runPurchaseRewardUseCase = async (
  input: PurchaseRewardInput,
  deps: {
    rewardGateway: InMemoryRewardGateway;
    purchaseGateway: InMemoryRewardPurchaseGateway;
    pointsCalc: InMemoryTripPointsCalculator;
    coinsService: InMemoryGroupCoinsService;
    accessChecker: InMemoryTripAccessChecker;
  },
) => {
  const program = purchaseRewardUseCase(input).pipe(
    Effect.provideService(RewardGatewayTag, {
      create: (reward: Reward) => deps.rewardGateway.create(reward),
      findById: (id: RewardId) => deps.rewardGateway.findById(id),
      findByTripId: (tripId: string, options?) =>
        deps.rewardGateway.findByTripId(tripId, options),
      findVisibleByTripId: (tripId: string, options?) =>
        deps.rewardGateway.findVisibleByTripId(tripId, options),
      update: (reward: Reward) => deps.rewardGateway.update(reward),
      delete: (id: RewardId) => deps.rewardGateway.delete(id),
      hasPurchases: (id: RewardId) => deps.rewardGateway.hasPurchases(id),
      getPurchaseCount: (id: RewardId) =>
        deps.rewardGateway.getPurchaseCount(id),
      decrementQuantity: (id: RewardId, amount: number) =>
        deps.rewardGateway.decrementQuantity(id, amount),
      incrementQuantity: (id: RewardId, amount: number) =>
        deps.rewardGateway.incrementQuantity(id, amount),
    }),
    Effect.provideService(RewardPurchaseGatewayTag, {
      create: (purchase: RewardPurchase) =>
        deps.purchaseGateway.create(purchase),
      findById: (id: string) => deps.purchaseGateway.findById(id),
      findByRewardId: (rewardId: RewardId, options?) =>
        deps.purchaseGateway.findByRewardId(rewardId, options),
      findByGroupId: (groupId: string, options?) =>
        deps.purchaseGateway.findByGroupId(groupId, options),
      findByTripId: (tripId: string, options?) =>
        deps.purchaseGateway.findByTripId(tripId, options),
      updateStatus: (
        id: string,
        status: string,
        updatedById: string,
        collectionMethod?,
      ) =>
        deps.purchaseGateway.updateStatus(
          id,
          status,
          updatedById,
          collectionMethod,
        ),
      countByRewardId: (rewardId: RewardId) =>
        deps.purchaseGateway.countByRewardId(rewardId),
    }),
    Effect.provideService(TripPointsCalculatorTag, {
      calculateTotalAvailablePoints: (tripId: string) =>
        deps.pointsCalc.calculateTotalAvailablePoints(tripId),
    }),
    Effect.provideService(GroupCoinsServiceTag, {
      getBalance: (groupId: string) => deps.coinsService.getBalance(groupId),
      deductCoins: (
        groupId: string,
        amount: number,
        reason: string,
        adminId: string,
      ) => deps.coinsService.deductCoins(groupId, amount, reason, adminId),
      addCoins: (
        groupId: string,
        amount: number,
        reason: string,
        adminId: string,
      ) => deps.coinsService.addCoins(groupId, amount, reason, adminId),
    }),
    Effect.provideService(TripAccessCheckerTag, {
      isGroupLeader: (userId: string, tripId: string) =>
        deps.accessChecker.isGroupLeader(userId, tripId),
      isStaff: (userId: string) => deps.accessChecker.isStaff(userId),
      hasTripEnded: (tripId: string) => deps.accessChecker.hasTripEnded(tripId),
    }),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] purchaseRewardUseCase (Effect)", () => {
  let rewardGateway: InMemoryRewardGateway;
  let purchaseGateway: InMemoryRewardPurchaseGateway;
  let pointsCalc: InMemoryTripPointsCalculator;
  let coinsService: InMemoryGroupCoinsService;
  let accessChecker: InMemoryTripAccessChecker;

  beforeEach(() => {
    rewardGateway = new InMemoryRewardGateway();
    purchaseGateway = new InMemoryRewardPurchaseGateway();
    pointsCalc = new InMemoryTripPointsCalculator();
    coinsService = new InMemoryGroupCoinsService();
    accessChecker = new InMemoryTripAccessChecker();
  });

  describe("[UNIT] execute", () => {
    it("should successfully purchase reward", async () => {
      // Arrange
      const mockReward = createValidReward(10);

      // Execute the Effect to actually store the reward
      await Effect.runPromise(rewardGateway.create(mockReward));

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
      const result = await runPurchaseRewardUseCase(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });

      // Assert
      expect(result.rewardId).toBe(mockReward.id);
      expect(result.groupId).toBe("group-123");
      expect(result.quantity).toBe(2);
      expect(result.totalCost).toBe(200); // 2 * (10% of 1000)
      expect(result.status).toBe("BOUGHT");

      // Verify reward quantity was decremented
      const updatedReward = await Effect.runPromise(
        rewardGateway.findById(mockReward.id),
      );
      expect(updatedReward?.availableQuantity).toBe(8); // 10 - 2

      // Verify coins were deducted
      const remainingCoins = await Effect.runPromise(
        coinsService.getBalance("group-123"),
      );
      expect(remainingCoins).toBe(300); // 500 - 200

      // Verify purchase was recorded
      const purchases = await Effect.runPromise(
        purchaseGateway.findByRewardId(mockReward.id),
      );
      expect(purchases.total).toBe(1);
    });

    it("should reject purchase when reward not found", async () => {
      const input: PurchaseRewardInput = {
        rewardId: RewardId.unsafeCreate("nonexistent-id"),
        quantity: 2,
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RewardNotFoundError);
      }
    });

    it("should reject purchase when user is not group leader", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await Effect.runPromise(rewardGateway.create(mockReward));

      pointsCalc.setPoints("trip-123", 1000);
      // Don't set user as group leader

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotGroupLeaderError);
      }
    });

    it("should reject purchase when insufficient quantity", async () => {
      // Arrange
      const mockReward = createValidReward(5); // Only 5 available
      await Effect.runPromise(rewardGateway.create(mockReward));

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 10, // Trying to buy 10 when only 5 available
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InsufficientQuantityError);
      }
    });

    it("should reject purchase when insufficient coins", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await Effect.runPromise(rewardGateway.create(mockReward));

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 50); // Only 50 coins
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2, // Need 200 coins (2 * 10% of 1000)
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InsufficientCoinsError);
      }
    });

    it("should reject purchase when trip has ended", async () => {
      // Arrange
      const mockReward = createValidReward(10);
      await Effect.runPromise(rewardGateway.create(mockReward));

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");
      accessChecker.setTripEnded("trip-123"); // Trip has ended

      const input: PurchaseRewardInput = {
        rewardId: mockReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(TripEndedError);
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
      await Effect.runPromise(rewardGateway.create(hiddenReward));

      pointsCalc.setPoints("trip-123", 1000);
      coinsService.setBalance("group-123", 500);
      accessChecker.setGroupLeader("user-123", "group-123");

      const input: PurchaseRewardInput = {
        rewardId: hiddenReward.id,
        quantity: 2,
        userId: "user-123",
      };

      // Act - use Either to properly check error type
      const program = buildPurchaseRewardProgram(input, {
        rewardGateway,
        purchaseGateway,
        pointsCalc,
        coinsService,
        accessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RewardHiddenError);
      }
    });
  });
});
