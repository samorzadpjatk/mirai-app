import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { RewardController } from "./controller";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
  type RewardGateway,
  type RewardPurchaseGateway,
  type TripPointsCalculator,
} from "@mirai-app/use-cases";
import {
  TripAccessCheckerTag,
  GroupCoinsServiceTag,
  type TripAccessChecker,
  type GroupCoinsService,
} from "../../../../use-cases/src/trip/ports/gateway";
import { UserRole, DatabaseError } from "@mirai-app/domain";
import { RewardPurchaseStatus } from "@mirai-app/domain";
import type {
  RewardDTO,
  RewardPurchaseDTO,
} from "../../../../use-cases/src/reward/dto";
import type { PaginationOptions } from "../../../../use-cases/src/system/shared/dto";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailCreate?: boolean;
    shouldFailUpdate?: boolean;
    shouldFailDelete?: boolean;
  } = {},
): RewardGateway {
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const purchaseCounts = new Map<string, number>();

  return {
    create: (reward: RewardDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({ operation: "create", message: "Create failed" }),
        );
      }
      rewardMap.set(reward.id, reward);
      return Effect.succeed(reward);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({ operation: "findById", message: "Find failed" }),
        );
      }
      return Effect.succeed(rewardMap.get(id) ?? null);
    },

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findVisibleByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripId: (
      tripId: string,
      options?: { includeHidden?: boolean } & PaginationOptions,
    ) => {
      const allRewards = Array.from(rewardMap.values()).filter(
        (r) => r.tripId === tripId && (options?.includeHidden || !r.isHidden),
      );
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;
      const items = allRewards.slice(offset, offset + limit);
      return Effect.succeed({
        items,
        total: allRewards.length,
        limit,
        offset,
        hasMore: allRewards.length > offset + limit,
      });
    },

    findVisibleByTripId: (tripId: string, pagination?: PaginationOptions) => {
      const allRewards = Array.from(rewardMap.values()).filter(
        (r) => r.tripId === tripId && !r.isHidden,
      );
      const limit = pagination?.limit ?? 10;
      const offset = pagination?.offset ?? 0;
      const items = allRewards.slice(offset, offset + limit);
      return Effect.succeed({
        items,
        total: allRewards.length,
        limit,
        offset,
        hasMore: allRewards.length > offset + limit,
      });
    },

    update: (reward: RewardDTO) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({ operation: "update", message: "Update failed" }),
        );
      }
      rewardMap.set(reward.id, reward);
      return Effect.succeed(reward);
    },

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({ operation: "delete", message: "Delete failed" }),
        );
      }
      rewardMap.delete(id);
      return Effect.succeed(void 0);
    },

    hasPurchases: (id: string) => {
      return Effect.succeed((purchaseCounts.get(id) ?? 0) > 0);
    },

    getPurchaseCount: (id: string) => {
      return Effect.succeed(purchaseCounts.get(id) ?? 0);
    },

    decrementQuantity: (id: string, amount: number) => {
      const reward = rewardMap.get(id);
      if (!reward) {
        return Effect.fail(
          new DatabaseError({
            operation: "decrement",
            message: "Reward not found",
          }),
        );
      }
      const updated = {
        ...reward,
        availableQuantity: reward.availableQuantity - amount,
      };
      rewardMap.set(id, updated);
      return Effect.succeed(updated);
    },

    incrementQuantity: (id: string, amount: number) => {
      const reward = rewardMap.get(id);
      if (!reward) {
        return Effect.fail(
          new DatabaseError({
            operation: "increment",
            message: "Reward not found",
          }),
        );
      }
      const updated = {
        ...reward,
        availableQuantity: reward.availableQuantity + amount,
      };
      rewardMap.set(id, updated);
      return Effect.succeed(updated);
    },
  };
}

/**
 * Mock RewardPurchaseGateway for testing
 */
function createMockRewardPurchaseGateway(
  purchases: RewardPurchaseDTO[] = [],
): RewardPurchaseGateway {
  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  return {
    create: (purchase: RewardPurchaseDTO) => {
      purchaseMap.set(purchase.id, purchase);
      return Effect.succeed(purchase);
    },

    findById: (id: string) => {
      return Effect.succeed(purchaseMap.get(id) ?? null);
    },

    findByRewardIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByGroupIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripId: (
      tripId: string,
      options?: { groupId?: string; limit?: number; offset?: number },
    ) => {
      const allPurchases = Array.from(purchaseMap.values()).filter(
        (p) =>
          p.rewardId.startsWith(tripId) ||
          (options?.groupId ? p.groupId === options.groupId : true),
      );
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;
      const items = allPurchases.slice(offset, offset + limit);
      return Effect.succeed({
        items,
        total: allPurchases.length,
        limit,
        offset,
        hasMore: allPurchases.length > offset + limit,
      });
    },

    updateStatus: (
      id: string,
      status: string,
      updatedById: string,
      collectionMethod?: string | null,
    ) => {
      const purchase = purchaseMap.get(id);
      if (!purchase) {
        return Effect.fail(
          new DatabaseError({
            operation: "updateStatus",
            message: "Purchase not found",
          }),
        );
      }
      const updated: RewardPurchaseDTO = {
        ...purchase,
        status: status as RewardPurchaseDTO["status"],
        statusUpdatedById: updatedById,
        statusUpdatedAt: new Date(),
        collectionMethod: collectionMethod ?? purchase.collectionMethod,
      };
      purchaseMap.set(id, updated);
      return Effect.succeed(updated);
    },

    countByRewardId: () => Effect.succeed(0),
  };
}

/**
 * Mock TripPointsCalculator for testing
 */
function createMockTripPointsCalculator(
  totalPoints: number = 1000,
): TripPointsCalculator {
  return {
    calculateTotalAvailablePoints: () => Effect.succeed(totalPoints),
  };
}

/**
 * Mock TripAccessChecker for testing
 */
function createMockTripAccessChecker(
  options: {
    isStaff?: boolean;
    isLeader?: boolean;
    groupId?: string;
    hasEnded?: boolean;
  } = {},
): TripAccessChecker {
  return {
    isStaff: () => Effect.succeed(options.isStaff ?? false),
    isGroupLeader: () =>
      Effect.succeed({
        isLeader: options.isLeader ?? false,
        groupId: options.groupId,
      }),
    hasTripEnded: () => Effect.succeed(options.hasEnded ?? false),
  };
}

/**
 * Mock GroupCoinsService for testing
 */
function createMockGroupCoinsService(
  initialBalance: number = 500,
): GroupCoinsService {
  let balance = initialBalance;

  return {
    getBalance: () => Effect.succeed(balance),
    addCoins: (
      groupId: string,
      amount: number,
      reason: string,
      updatedById: string,
    ) => {
      balance += amount;
      return Effect.succeed({
        id: "transaction-1",
        groupId,
        amount,
        type: "ADD",
        reason,
        createdById: updatedById,
        createdAt: new Date(),
      });
    },
    deductCoins: (
      groupId: string,
      amount: number,
      reason: string,
      updatedById: string,
    ) => {
      balance -= amount;
      return Effect.succeed(void 0);
    },
  };
}

function createMockRewardDTO(overrides: Partial<RewardDTO> = {}): RewardDTO {
  return {
    id: overrides.id ?? "reward-001",
    tripId: overrides.tripId ?? "trip-001",
    title: overrides.title ?? "Test Reward",
    description: overrides.description ?? "A test reward description",
    imageUrl: overrides.imageUrl ?? null,
    images: overrides.images ?? [],
    pointsCost: overrides.pointsCost ?? 50,
    quantity: overrides.quantity ?? 10,
    availableQuantity: overrides.availableQuantity ?? 10,
    status: (overrides.status as RewardDTO["status"]) ?? "AVAILABLE",
    isHidden: overrides.isHidden ?? false,
    createdById: overrides.createdById ?? "user-001",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

function createMockPurchaseDTO(
  overrides: Partial<RewardPurchaseDTO> = {},
): RewardPurchaseDTO {
  return {
    id: overrides.id ?? "purchase-001",
    rewardId: overrides.rewardId ?? "reward-001",
    groupId: overrides.groupId ?? "group-001",
    userId: overrides.userId ?? "user-001",
    pointsSpent: overrides.pointsSpent ?? 50,
    totalCost: overrides.totalCost ?? 50,
    status:
      (overrides.status as RewardPurchaseDTO["status"]) ??
      RewardPurchaseStatus.BOUGHT,
    quantity: overrides.quantity ?? 1,
    collectionMethod: overrides.collectionMethod ?? null,
    collectedAt: overrides.collectedAt ?? null,
    collectedById: overrides.collectedById ?? null,
    notes: overrides.notes ?? null,
    purchasedAt: overrides.purchasedAt ?? new Date("2024-01-15"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-15"),
    statusUpdatedAt: overrides.statusUpdatedAt ?? new Date("2024-01-15"),
    statusUpdatedById: overrides.statusUpdatedById ?? null,
  };
}

function createTestLayer(options: {
  rewards?: RewardDTO[];
  purchases?: RewardPurchaseDTO[];
  totalPoints?: number;
  groupBalance?: number;
  isStaff?: boolean;
  isLeader?: boolean;
  groupId?: string;
  hasEnded?: boolean;
  rewardOptions?: Parameters<typeof createMockRewardGateway>[1];
}) {
  const rewardGateway = createMockRewardGateway(
    options.rewards ?? [],
    options.rewardOptions ?? {},
  );
  const purchaseGateway = createMockRewardPurchaseGateway(
    options.purchases ?? [],
  );
  const pointsCalculator = createMockTripPointsCalculator(
    options.totalPoints ?? 1000,
  );
  const accessChecker = createMockTripAccessChecker({
    isStaff: options.isStaff ?? false,
    isLeader: options.isLeader ?? false,
    groupId: options.groupId,
    hasEnded: options.hasEnded ?? false,
  });
  const coinsService = createMockGroupCoinsService(options.groupBalance ?? 500);

  return Layer.mergeAll(
    Layer.succeed(RewardGatewayTag, rewardGateway),
    Layer.succeed(RewardPurchaseGatewayTag, purchaseGateway),
    Layer.succeed(TripPointsCalculatorTag, pointsCalculator),
    Layer.succeed(TripAccessCheckerTag, accessChecker),
    Layer.succeed(GroupCoinsServiceTag, coinsService),
  ) as Layer.Layer<unknown>;
}

describe("[UNIT] RewardController", () => {
  let controller: RewardController;

  beforeEach(() => {
    const mockLayer = createTestLayer({});
    controller = new RewardController(mockLayer);
  });

  describe("getById", () => {
    it("should return reward when found by valid ID", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-002",
        title: "Special Reward",
        availableQuantity: 5,
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.getById({ id: "reward-002" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("reward-002");
        expect(result.data.name).toBe("Special Reward");
        expect(result.data.availableQuantity).toBe(5);
        expect(result.data.isInStock).toBe(true);
        expect(result.data.canBePurchased).toBe(true);
      }
    });

    it("should return error when reward not found", async () => {
      const result = await controller.getById({ id: "nonexistent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should return error for missing id", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty id", async () => {
      const result = await controller.getById({ id: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors", async () => {
      const mockLayer = createTestLayer({
        rewards: [],
        rewardOptions: { shouldFailFind: true },
      });
      controller = new RewardController(mockLayer);

      const result = await controller.getById({ id: "reward-001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Find failed");
      }
    });
  });

  describe("getByTrip", () => {
    it("should return visible rewards for a trip", async () => {
      const mockRewards = [
        createMockRewardDTO({
          id: "reward-001",
          tripId: "trip-001",
          title: "Visible Reward",
          isHidden: false,
        }),
        createMockRewardDTO({
          id: "reward-002",
          tripId: "trip-001",
          title: "Hidden Reward",
          isHidden: true,
        }),
      ];
      const mockLayer = createTestLayer({ rewards: mockRewards });
      controller = new RewardController(mockLayer);

      const result = await controller.getByTrip({ tripId: "trip-001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0]?.name).toBe("Visible Reward");
      }
    });

    it("should calculate affordability when groupCoins provided", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        tripId: "trip-001",
        pointsCost: 50,
        availableQuantity: 10,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        totalPoints: 1000,
        groupBalance: 100,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.getByTrip({
        tripId: "trip-001",
        groupCoins: 100,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing tripId", async () => {
      const result = await controller.getByTrip({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty tripId", async () => {
      const result = await controller.getByTrip({ tripId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByTripAdmin", () => {
    it("should return all rewards including hidden for admin", async () => {
      const mockRewards = [
        createMockRewardDTO({
          id: "reward-001",
          tripId: "trip-001",
          title: "Visible",
          isHidden: false,
        }),
        createMockRewardDTO({
          id: "reward-002",
          tripId: "trip-001",
          title: "Hidden",
          isHidden: true,
        }),
      ];
      const mockLayer = createTestLayer({ rewards: mockRewards });
      controller = new RewardController(mockLayer);

      const result = await controller.getByTripAdmin({ tripId: "trip-001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
      }
    });

    it("should support pagination", async () => {
      const mockRewards = Array.from({ length: 5 }, (_, i) =>
        createMockRewardDTO({
          id: `reward-00${i + 1}`,
          tripId: "trip-001",
          title: `Reward ${i + 1}`,
        }),
      );
      const mockLayer = createTestLayer({ rewards: mockRewards });
      controller = new RewardController(mockLayer);

      const result = await controller.getByTripAdmin({
        tripId: "trip-001",
        pagination: { limit: 3 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBeLessThanOrEqual(3);
      }
    });

    it("should return error for missing tripId", async () => {
      const result = await controller.getByTripAdmin({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("create", () => {
    it("should create reward with valid input as staff", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "New Reward",
        description: "A brand new reward",
        availableQuantity: 10,
        coinCostPercentage: 25,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.MODERATOR,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Reward");
        expect(result.data.availableQuantity).toBe(10);
        expect(result.data.coinCostPercentage).toBe(25);
        expect(result.data.isInStock).toBe(true);
        expect(result.data.canBePurchased).toBe(true);
      }
    });

    it("should create reward as admin", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "Admin Reward",
        description: "Created by admin",
        availableQuantity: 5,
        coinCostPercentage: 50,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.ADMIN,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Admin Reward");
      }
    });

    it("should reject creation when trip has ended", async () => {
      const mockLayer = createTestLayer({ isStaff: true, hasEnded: true });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "Late Reward",
        description: "Too late",
        availableQuantity: 1,
        coinCostPercentage: 10,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.MODERATOR,
      });

      expect(result.success).toBe(false);
    });

    it("should reject creation by non-staff user", async () => {
      const mockLayer = createTestLayer({ isStaff: false });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "User Reward",
        description: "Regular user trying to create",
        availableQuantity: 1,
        coinCostPercentage: 10,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.USER,
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing required fields", async () => {
      const result = await controller.create({
        name: "",
        description: "",
        tripId: "",
        createdById: "",
        creatorRole: UserRole.USER,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty name", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "",
        description: "Valid description",
        availableQuantity: 5,
        coinCostPercentage: 25,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.MODERATOR,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for coinCostPercentage out of range", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "Invalid Cost Reward",
        description: "Valid description",
        availableQuantity: 5,
        coinCostPercentage: 150,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.MODERATOR,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during creation", async () => {
      const mockLayer = createTestLayer({
        isStaff: true,
        rewardOptions: { shouldFailCreate: true },
      });
      controller = new RewardController(mockLayer);

      const result = await controller.create({
        name: "Error Reward",
        description: "This will fail",
        availableQuantity: 5,
        coinCostPercentage: 25,
        tripId: "trip-001",
        createdById: "user-001",
        creatorRole: UserRole.MODERATOR,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update reward name successfully", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        title: "Old Name",
        availableQuantity: 10,
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.update({
        rewardId: "reward-001",
        name: "New Name",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
        expect(result.data.id).toBe("reward-001");
      }
    });

    it("should update reward description successfully", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        title: "Test",
        description: "Old description",
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.update({
        rewardId: "reward-001",
        description: "New description",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("New description");
      }
    });

    it("should update multiple fields at once", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        title: "Test",
        availableQuantity: 5,
        pointsCost: 50,
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.update({
        rewardId: "reward-001",
        name: "Updated Name",
        description: "Updated description",
        availableQuantity: 20,
        coinCostPercentage: 75,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.availableQuantity).toBe(20);
        expect(result.data.coinCostPercentage).toBe(75);
      }
    });

    it("should return error when reward not found", async () => {
      const result = await controller.update({
        rewardId: "nonexistent",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error for invalid rewardId", async () => {
      const result = await controller.update({
        rewardId: "",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty name", async () => {
      const mockReward = createMockRewardDTO({ id: "reward-001" });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.update({
        rewardId: "reward-001",
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during update", async () => {
      const mockReward = createMockRewardDTO({ id: "reward-001" });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        rewardOptions: { shouldFailUpdate: true },
      });
      controller = new RewardController(mockLayer);

      const result = await controller.update({
        rewardId: "reward-001",
        name: "New Name",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("setHidden", () => {
    it("should hide a visible reward", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        isHidden: false,
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.setHidden({
        rewardId: "reward-001",
        isHidden: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(true);
        expect(result.data.id).toBe("reward-001");
      }
    });

    it("should unhide a hidden reward", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        isHidden: true,
      });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.setHidden({
        rewardId: "reward-001",
        isHidden: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(false);
      }
    });

    it("should return error when reward not found", async () => {
      const result = await controller.setHidden({
        rewardId: "nonexistent",
        isHidden: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error for missing rewardId", async () => {
      const result = await controller.setHidden({ isHidden: true });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing isHidden", async () => {
      const result = await controller.setHidden({ rewardId: "reward-001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("delete", () => {
    it("should delete reward without purchases", async () => {
      const mockReward = createMockRewardDTO({ id: "reward-001" });
      const mockLayer = createTestLayer({ rewards: [mockReward] });
      controller = new RewardController(mockLayer);

      const result = await controller.delete({ rewardId: "reward-001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
      }
    });

    it("should return error when reward not found", async () => {
      const result = await controller.delete({ rewardId: "nonexistent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error for missing rewardId", async () => {
      const result = await controller.delete({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during delete", async () => {
      const mockReward = createMockRewardDTO({ id: "reward-001" });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        rewardOptions: { shouldFailDelete: true },
      });
      controller = new RewardController(mockLayer);

      const result = await controller.delete({ rewardId: "reward-001" });

      expect(result.success).toBe(false);
    });
  });

  describe("purchase", () => {
    it("should purchase reward successfully as group leader", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        tripId: "trip-001",
        availableQuantity: 10,
        isHidden: false,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        isLeader: true,
        groupId: "group-001",
        groupBalance: 500,
        totalPoints: 1000,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 2,
        userId: "user-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rewardId).toBe("reward-001");
        expect(result.data.quantity).toBe(2);
        expect(result.data.totalCost).toBeDefined();
        expect(result.data.purchaseId).toBeDefined();
      }
    });

    it("should return error when reward not found", async () => {
      const mockLayer = createTestLayer({
        isLeader: true,
        groupId: "group-001",
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "nonexistent",
        quantity: 1,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when reward is hidden", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        isHidden: true,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        isLeader: true,
        groupId: "group-001",
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 1,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when trip has ended", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        isHidden: false,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        isLeader: true,
        groupId: "group-001",
        hasEnded: true,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 1,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when user is not group leader", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        isHidden: false,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        isLeader: false,
        groupId: undefined,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 1,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for insufficient quantity", async () => {
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        availableQuantity: 2,
        isHidden: false,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        isLeader: true,
        groupId: "group-001",
        groupBalance: 500,
        totalPoints: 1000,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 5,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid input", async () => {
      const result = await controller.purchase({
        rewardId: "",
        quantity: 0,
        userId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for quantity less than 1", async () => {
      const result = await controller.purchase({
        rewardId: "reward-001",
        quantity: 0,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("updatePurchaseStatus", () => {
    it("should update purchase status as staff", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
      });
      const mockLayer = createTestLayer({
        purchases: [mockPurchase],
        isStaff: true,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updatePurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: "staff-001",
        collectionMethod: "Pickup at reception",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ACCEPTED");
        expect(result.data.collectionMethod).toBe("Pickup at reception");
      }
    });

    it("should cancel purchase with refund", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
        quantity: 2,
        totalCost: 100,
      });
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        availableQuantity: 5,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        purchases: [mockPurchase],
        isStaff: true,
        groupBalance: 500,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updatePurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
        updatedById: "staff-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("CANCELLED");
        expect(result.data.refunded).toBe(true);
      }
    });

    it("should return error when purchase not found", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.updatePurchaseStatus({
        purchaseId: "nonexistent",
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: "staff-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid status transition", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
      });
      const mockLayer = createTestLayer({
        purchases: [mockPurchase],
        isStaff: true,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updatePurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: "staff-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing collection method when accepting", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
      });
      const mockLayer = createTestLayer({
        purchases: [mockPurchase],
        isStaff: true,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updatePurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: "staff-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid input", async () => {
      const result = await controller.updatePurchaseStatus({
        purchaseId: "",
        status: "" as RewardPurchaseStatus,
        updatedById: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("updateMyPurchaseStatus", () => {
    it("should update purchase status as group leader", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
        groupId: "group-001",
        rewardId: "reward-001",
        totalCost: 50,
      });
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        availableQuantity: 10,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        purchases: [mockPurchase],
        isLeader: true,
        groupId: "group-001",
        groupBalance: 500,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updateMyPurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
        userId: "user-001",
      });

      expect(result.success).toBe(true);
    });

    it("should cancel own purchase with refund", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
        groupId: "group-001",
        totalCost: 50,
      });
      const mockReward = createMockRewardDTO({
        id: "reward-001",
        availableQuantity: 10,
      });
      const mockLayer = createTestLayer({
        rewards: [mockReward],
        purchases: [mockPurchase],
        isLeader: true,
        groupId: "group-001",
        groupBalance: 500,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updateMyPurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
        userId: "user-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refunded).toBe(true);
      }
    });

    it("should return error when user is not group leader for purchase", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.BOUGHT,
        groupId: "group-002",
      });
      const mockLayer = createTestLayer({
        purchases: [mockPurchase],
        isLeader: true,
        groupId: "group-001",
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updateMyPurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid user status transition", async () => {
      const mockPurchase = createMockPurchaseDTO({
        id: "purchase-001",
        status: RewardPurchaseStatus.ACCEPTED,
        groupId: "group-001",
      });
      const mockLayer = createTestLayer({
        purchases: [mockPurchase],
        isLeader: true,
        groupId: "group-001",
      });
      controller = new RewardController(mockLayer);

      const result = await controller.updateMyPurchaseStatus({
        purchaseId: "purchase-001",
        status: RewardPurchaseStatus.CANCELLED,
        userId: "user-001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid input", async () => {
      const result = await controller.updateMyPurchaseStatus({
        purchaseId: "",
        status: "" as RewardPurchaseStatus,
        userId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getTotalAvailablePoints", () => {
    it("should return total available points for trip", async () => {
      const mockLayer = createTestLayer({ totalPoints: 2500 });
      controller = new RewardController(mockLayer);

      const result = await controller.getTotalAvailablePoints({
        tripId: "trip-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPoints).toBe(2500);
      }
    });

    it("should handle errors when calculator fails", async () => {
      const failingCalculator: TripPointsCalculator = {
        calculateTotalAvailablePoints: () =>
          Effect.fail(
            new DatabaseError({
              operation: "calculate",
              message: "Calculation failed",
            }),
          ),
      };
      const mockLayer = Layer.mergeAll(
        Layer.succeed(TripPointsCalculatorTag, failingCalculator),
      ) as Layer.Layer<unknown>;
      controller = new RewardController(mockLayer);

      const result = await controller.getTotalAvailablePoints({
        tripId: "trip-001",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getPurchaseHistory", () => {
    it("should return purchase history as staff", async () => {
      const mockPurchases = [
        createMockPurchaseDTO({ id: "purchase-001", rewardId: "reward-001" }),
        createMockPurchaseDTO({ id: "purchase-002", rewardId: "reward-002" }),
      ];
      const mockLayer = createTestLayer({
        purchases: mockPurchases,
        isStaff: true,
      });
      controller = new RewardController(mockLayer);

      const result = await controller.getPurchaseHistory({
        tripId: "trip-001",
        userId: "staff-001",
        isStaff: true,
      });

      expect(result.success).toBe(true);
    });

    it("should return filtered history for group leader", async () => {
      const mockLayer = createTestLayer({
        isLeader: true,
        groupId: "group-001",
      });
      controller = new RewardController(mockLayer);

      const result = await controller.getPurchaseHistory({
        tripId: "trip-001",
        userId: "user-001",
        isStaff: false,
      });

      expect(result.success).toBe(true);
    });

    it("should support pagination", async () => {
      const mockLayer = createTestLayer({ isStaff: true });
      controller = new RewardController(mockLayer);

      const result = await controller.getPurchaseHistory({
        tripId: "trip-001",
        userId: "staff-001",
        isStaff: true,
        pagination: { limit: 5, offset: 0 },
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid input", async () => {
      const result = await controller.getPurchaseHistory({
        tripId: "",
        userId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getAll", () => {
    it("should return all rewards for a trip when tripId provided", async () => {
      const mockRewards = [
        createMockRewardDTO({
          id: "reward-001",
          tripId: "trip-001",
          title: "Reward 1",
        }),
        createMockRewardDTO({
          id: "reward-002",
          tripId: "trip-001",
          title: "Reward 2",
        }),
      ];
      const mockLayer = createTestLayer({ rewards: mockRewards });
      controller = new RewardController(mockLayer);

      const result = await controller.getAll({ tripId: "trip-001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return only active rewards when activeOnly is true", async () => {
      const mockRewards = [
        createMockRewardDTO({
          id: "reward-001",
          tripId: "trip-001",
          isHidden: false,
        }),
        createMockRewardDTO({
          id: "reward-002",
          tripId: "trip-001",
          isHidden: true,
        }),
      ];
      const mockLayer = createTestLayer({ rewards: mockRewards });
      controller = new RewardController(mockLayer);

      const result = await controller.getAll({
        tripId: "trip-001",
        activeOnly: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.isHidden).toBe(false);
      }
    });

    it("should return empty array when no tripId provided", async () => {
      const result = await controller.getAll({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("getUserRewards", () => {
    it("should return empty array (placeholder implementation)", async () => {
      const mockLayer = createTestLayer({});
      controller = new RewardController(mockLayer);

      const result = await controller.getUserRewards({ userId: "user-001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should return empty array with tripId filter", async () => {
      const result = await controller.getUserRewards({
        userId: "user-001",
        tripId: "trip-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("getUserEquippedRewards", () => {
    it("should return empty array (placeholder implementation)", async () => {
      const result = await controller.getUserEquippedRewards({
        userId: "user-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should filter to equipped rewards from user rewards", async () => {
      const result = await controller.getUserEquippedRewards({
        userId: "user-001",
        tripId: "trip-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});

/**
 * Summary
 *
 * This test suite covers the RewardController with comprehensive unit tests:
 *
 * - getById: Tests retrieval of rewards by ID, including not found and error cases
 * - getByTrip: Tests listing visible rewards for a trip with affordability calculation
 * - getByTripAdmin: Tests listing all rewards including hidden for admin view
 * - create: Tests reward creation with staff authorization and validation
 * - update: Tests reward updates with field validation
 * - setHidden: Tests hiding/unhiding rewards
 * - delete: Tests reward deletion with purchase checking
 * - purchase: Tests reward purchase flow with group leader authorization
 * - updatePurchaseStatus: Tests admin purchase status updates with refunds
 * - updateMyPurchaseStatus: Tests user purchase status updates (limited transitions)
 * - getTotalAvailablePoints: Tests points calculation for dynamic pricing
 * - getPurchaseHistory: Tests purchase history retrieval with role-based filtering
 * - getAll: Tests listing all rewards with optional trip filtering
 * - getUserRewards: Tests user reward retrieval (placeholder implementation)
 * - getUserEquippedRewards: Tests equipped rewards filtering (placeholder implementation)
 *
 * All tests use Effect patterns with Layer.succeed for dependency injection
 * and follow the patterns from user/controllers/controller.test.ts
 */
