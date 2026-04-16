import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { CoinTransactionController } from "./transaction-controller";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
  GroupGatewayTag,
  type GroupGateway,
  UserGatewayTag,
  type UserGateway,
  type GroupDTO,
  type UserDTO,
  type CursorPaginatedResult,
} from "@mirai-app/use-cases";
import type { CoinTransactionDTO, GroupId } from "@mirai-app/domain";

/**
 * Mock CoinTransactionGateway for testing
 */
function createMockCoinGateway(): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(10),
    sumAmount: () => Effect.succeed(500),
    sumAddedCoins: () => Effect.succeed(600),
    sumRemovedCoins: () => Effect.succeed(-100),
    getMostActiveAdmin: () =>
      Effect.succeed([
        {
          adminId: "admin-123",
          adminName: "Admin User",
          transactionCount: 15,
          coinsAwarded: 300,
          _sum: { amount: 300 },
          _count: { id: 15 },
        },
      ]),
    findManyConnection: () =>
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
    findMany: () => Effect.succeed([]),
    findRecent: () =>
      Effect.succeed([
        {
          id: "trans-1",
          groupId: "group-123",
          amount: 50,
          reason: "Test",
          adminId: "admin-123",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          group: {
            id: "group-123",
            name: "Test Group",
            coins: 100,
          },
          admin: {
            id: "admin-123",
            firstName: "Admin",
            lastName: "User",
          },
        } as CoinTransactionDTO,
      ]),
    getTotalCoinsByGroup: () =>
      Effect.succeed([
        { groupId: "group-123", _sum: { amount: 500 } },
        { groupId: "group-456", _sum: { amount: 300 } },
      ]),
    groupByAdmin: () =>
      Effect.succeed([{ adminId: "admin-123", _count: { id: 10 } }]),
    create: (data: {
      groupId: string;
      amount: number;
      reason?: string;
      adminId: string;
    }) =>
      Effect.succeed({
        id: "trans-123",
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason ?? null,
        adminId: data.adminId,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      } as CoinTransactionDTO),
    incrementGroupCoins: () => Effect.succeed(void 0),
    decrementGroupCoins: () => Effect.succeed({ success: true }),
    getGroupCoins: () => Effect.succeed(100),
    verifyGroupInTrip: () =>
      Effect.succeed({
        exists: true,
        tripId: "trip-123",
        isDeleted: false,
        coins: 100,
      }),
  } as CoinTransactionGateway;
}

function createMockCoinGatewayWithFindMany(
  transactions: CoinTransactionDTO[],
  total: number,
): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    count: () => Effect.succeed(total),
  } as CoinTransactionGateway;
}

function createMockCoinGatewayWithNullStats(): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    sumAmount: () => Effect.succeed(null),
  };
}

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(): GroupGateway {
  const emptyPaginatedResult: CursorPaginatedResult<
    GroupDTO,
    { id: string; createdAt: string }
  > = {
    items: [],
    total: 0,
    hasMore: false,
    nextCursor: null,
  };

  return {
    create: (group: GroupDTO) => Effect.succeed(group),
    findById: () =>
      Effect.succeed({
        id: "group-123",
        name: "Test Group",
        tripId: "trip-123",
        code: "GRP123",
        description: null,
        imageUrl: null,
        coins: 500,
        status: "ACTIVE",
        maxMembers: null,
        createdById: "user-123",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        deletedAt: null,
        deletedById: null,
      } as GroupDTO),
    findByTripIdConnection: () => Effect.succeed(emptyPaginatedResult),
    findByStatusConnection: () => Effect.succeed(emptyPaginatedResult),
    findByTripIdAndStatusConnection: () => Effect.succeed(emptyPaginatedResult),
    findByOrganizerIdConnection: () => Effect.succeed(emptyPaginatedResult),
    findAll: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    update: (group: GroupDTO) => Effect.succeed(group),
    delete: () => Effect.succeed(void 0),
    exists: () => Effect.succeed(true),
    existsByCode: () => Effect.succeed(false),
    findByCode: () => Effect.succeed(null),
    getCoins: () => Effect.succeed(100),
    updateCoins: (id: GroupId, amount: number) =>
      Effect.succeed({
        id: "group-123",
        name: "Test Group",
        tripId: "trip-123",
        code: "GRP123",
        description: null,
        imageUrl: null,
        coins: amount,
        status: "ACTIVE",
        maxMembers: null,
        createdById: "user-123",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        deletedAt: null,
        deletedById: null,
      } as GroupDTO),
    findTripParticipantsConnection: () =>
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
    findParticipantByUserIdAndTripId: () => Effect.succeed(null),
    assignUserToGroup: () =>
      Effect.succeed({
        id: "participant-1",
        userId: "user-123",
        groupId: "group-123",
        tripId: "trip-123",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date("2024-01-01"),
        leftAt: null,
        invitedById: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }),
    removeUserFromGroup: () =>
      Effect.succeed({
        id: "participant-1",
        userId: "user-123",
        groupId: "group-123",
        tripId: "trip-123",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date("2024-01-01"),
        leftAt: null,
        invitedById: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }),
  };
}

/**
 * Mock UserGateway for testing
 */
function createMockUserGateway(): UserGateway {
  return {
    create: (user: UserDTO) => Effect.succeed(user),
    findById: () =>
      Effect.succeed({
        id: "admin-123",
        authUserId: "auth-123",
        firstName: "Admin",
        lastName: "User",
        nickname: null,
        email: null,
        phone: null,
        avatarUrl: null,
        role: "ADMIN",
        status: "ACTIVE",
        groupId: null,
        bio: null,
        birthDate: null,
        shirtSize: null,
        dietaryRequirements: null,
        medicalInfo: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      } as UserDTO),
    findByAuthUserId: () => Effect.succeed(null),
    findAllConnection: () =>
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
    findByRoleConnection: () =>
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
    update: (user: UserDTO) => Effect.succeed(user),
    delete: () => Effect.succeed(void 0),
    existsByAuthUserId: () => Effect.succeed(false),
  };
}

describe("[UNIT] CoinTransactionController", () => {
  let controller: CoinTransactionController;
  let mockCoinLayer: Layer.Layer<unknown>;
  let mockGroupLayer: Layer.Layer<unknown>;
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    const mockCoinGateway = createMockCoinGateway();
    const mockGroupGateway = createMockGroupGateway();
    mockCoinLayer = Layer.succeed(
      CoinTransactionGatewayTag,
      mockCoinGateway,
    ) as Layer.Layer<unknown>;
    mockGroupLayer = Layer.succeed(
      GroupGatewayTag,
      mockGroupGateway,
    ) as Layer.Layer<unknown>;
    const combinedLayer = Layer.merge(mockCoinLayer, mockGroupLayer);
    controller = new CoinTransactionController(combinedLayer);
  });

  describe("getStatistics", () => {
    it("should return statistics for valid tripId", async () => {
      const result = await controller.getStatistics({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionCount).toBe(10);
        expect(result.data.addedCoins).toBe(600);
        expect(result.data.removedCoins).toBe(-100);
        expect(result.data.netBalance).toBe(500);
        expect(result.data.time).toBeInstanceOf(Date);
      }
    });

    it("should handle empty statistics gracefully", async () => {
      const emptyGateway: CoinTransactionGateway = {
        ...createMockCoinGateway(),
        count: () => Effect.succeed(0),
        sumAddedCoins: () => Effect.succeed(0),
        sumRemovedCoins: () => Effect.succeed(0),
      };
      const emptyLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        emptyGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinTransactionController(emptyLayer);

      const result = await controller.getStatistics({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionCount).toBe(0);
        expect(result.data.netBalance).toBe(0);
      }
    });
  });

  describe("getMostActiveAdminStats", () => {
    it("should return most active admin stats for valid tripId", async () => {
      const result = await controller.getMostActiveAdminStats({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        if (result.data) {
          expect(result.data.adminId).toBe("admin-123");
          expect(result.data.totalAmount).toBe(300);
          expect(result.data.transactionCount).toBe(15);
        }
      }
    });

    it("should return null when no admin stats available", async () => {
      const emptyGateway: CoinTransactionGateway = {
        ...createMockCoinGateway(),
        getMostActiveAdmin: () => Effect.succeed([]),
      };
      const emptyLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        emptyGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinTransactionController(emptyLayer);

      const result = await controller.getMostActiveAdminStats({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("getAll", () => {
    it("should return transactions with pagination", async () => {
      const result = await controller.getAll({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
    });

    it("should handle custom pagination limits", async () => {
      const result = await controller.getAll({
        tripId: validTripId,
        pagination: { limit: 5, offset: 0 },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getQuickStats", () => {
    it("should return quick stats for valid tripId", async () => {
      const result = await controller.getQuickStats({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.totalCoins).toBeDefined();
        expect(result.data.totalGroups).toBeDefined();
        expect(result.data.averageCoinsPerGroup).toBeDefined();
        expect(result.data.time).toBeInstanceOf(Date);
      }
    });

    it("should return null when no stats available", async () => {
      const nullStatsGateway = createMockCoinGatewayWithNullStats();
      const nullLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        nullStatsGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinTransactionController(
        Layer.merge(nullLayer, mockGroupLayer),
      );

      const result = await controller.getQuickStats({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("getAdditionalInsights", () => {
    beforeEach(() => {
      const mockCoinGateway = createMockCoinGateway();
      const mockUserGateway = createMockUserGateway();
      const coinLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        mockCoinGateway,
      ) as Layer.Layer<unknown>;
      const userLayer = Layer.succeed(
        UserGatewayTag,
        mockUserGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinTransactionController(
        Layer.merge(coinLayer, userLayer),
      );
    });

    it("should return additional insights for valid tripId", async () => {
      const result = await controller.getAdditionalInsights({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.mostActiveAdmin).toBeDefined();
        expect(result.data.recentTransactions).toBeDefined();
      }
    });

    it("should return null when no insights available", async () => {
      const emptyGateway: CoinTransactionGateway = {
        ...createMockCoinGateway(),
        findRecent: () => Effect.succeed([]),
        groupByAdmin: () => Effect.succeed([]),
      };
      const emptyLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        emptyGateway,
      ) as Layer.Layer<unknown>;
      const mockUserGateway = createMockUserGateway();
      const userLayer = Layer.succeed(
        UserGatewayTag,
        mockUserGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinTransactionController(
        Layer.merge(emptyLayer, userLayer),
      );

      const result = await controller.getAdditionalInsights({
        tripId: validTripId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("getCoinTransactions", () => {
    it("should return transactions for participant user", async () => {
      const result = await controller.getCoinTransactions({
        tripId: validTripId,
        groupId: validGroupId,
        limit: 10,
        isParticipant: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it("should return error for non-participant user", async () => {
      const result = await controller.getCoinTransactions({
        tripId: validTripId,
        limit: 10,
        isParticipant: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not a participant");
      }
    });
  });

  describe("getManyConnection", () => {
    it("should return paginated transactions with cursor", async () => {
      const result = await controller.getManyConnection({
        tripId: validTripId,
        first: 10,
        after: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.items)).toBe(true);
        expect(typeof result.data.hasMore).toBe("boolean");
      }
    });

    it("should handle cursor-based pagination", async () => {
      const result = await controller.getManyConnection({
        tripId: validTripId,
        first: 5,
        after: { id: "cursor-id", createdAt: new Date("2024-01-01") },
      });

      expect(result.success).toBe(true);
    });

    it("should filter by groupId when provided", async () => {
      const result = await controller.getManyConnection({
        tripId: validTripId,
        groupId: validGroupId,
        first: 10,
        after: null,
      });

      expect(result.success).toBe(true);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - CoinTransactionController.getStatistics: retrieving coin statistics
 * - CoinTransactionController.getMostActiveAdminStats: finding most active admin
 * - CoinTransactionController.getAll: paginated transaction list
 * - CoinTransactionController.getQuickStats: quick stats summary
 * - CoinTransactionController.getAdditionalInsights: additional insights with user resolution
 * - CoinTransactionController.getCoinTransactions: participant-only transactions
 * - CoinTransactionController.getManyConnection: cursor-based pagination
 *
 * All public methods tested:
 * - getStatistics (2 cases)
 * - getMostActiveAdminStats (2 cases)
 * - getAll (2 cases)
 * - getQuickStats (2 cases)
 * - getAdditionalInsights (2 cases)
 * - getCoinTransactions (2 cases)
 * - getManyConnection (3 cases)
 *
 * Patterns used:
 * - Effect Layer injection for mocking dependencies
 * - Layer.merge for multiple dependencies (CoinGateway + GroupGateway/UserGateway)
 * - [UNIT] prefix for all test descriptions
 */
