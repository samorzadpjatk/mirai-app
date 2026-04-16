import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { CoinController } from "./coin-controller";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "@mirai-app/use-cases";
import type { CoinTransactionDTO } from "@mirai-app/domain";

/**
 * Mock CoinTransactionGateway for testing
 */
function createMockCoinGateway(): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(0),
    sumAmount: () => Effect.succeed(null),
    sumAddedCoins: () => Effect.succeed(0),
    sumRemovedCoins: () => Effect.succeed(0),
    getMostActiveAdmin: () => Effect.succeed([]),
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
    findRecent: () => Effect.succeed([]),
    getTotalCoinsByGroup: () => Effect.succeed([]),
    groupByAdmin: () => Effect.succeed([]),
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
    verifyGroupInTrip: (groupId: string, tripId: string) =>
      Effect.succeed({
        exists: true,
        tripId: tripId,
        isDeleted: false,
        coins: 100,
      }),
  };
}

function createMockCoinGatewayWithInsufficientCoins(): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    decrementGroupCoins: () =>
      Effect.succeed({ success: false, currentBalance: 5 }),
  };
}

function createMockCoinGatewayWithGroupNotFound(): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    verifyGroupInTrip: () =>
      Effect.succeed({
        exists: false,
      }),
  };
}

function createMockCoinGatewayWithGroupNotInTrip(): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    verifyGroupInTrip: (groupId: string, tripId: string) =>
      Effect.succeed({
        exists: true,
        tripId: "different-trip-id",
        isDeleted: false,
        coins: 100,
      }),
  };
}

function createMockCoinGatewayWithGroupDeleted(): CoinTransactionGateway {
  return {
    ...createMockCoinGateway(),
    verifyGroupInTrip: (groupId: string, tripId: string) =>
      Effect.succeed({
        exists: true,
        tripId: tripId,
        isDeleted: true,
        coins: 100,
      }),
  };
}

describe("[UNIT] CoinController", () => {
  let controller: CoinController;
  let mockLayer: Layer.Layer<unknown>;
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440002";
  const validAdminId = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    const mockGateway = createMockCoinGateway();
    mockLayer = Layer.succeed(
      CoinTransactionGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new CoinController(mockLayer);
  });

  describe("addCoins", () => {
    it("should add coins with valid input", async () => {
      const result = await controller.addCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
        reason: "Test reward",
        adminId: validAdminId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50);
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.adminId).toBe(validAdminId);
        expect(result.data.reason).toBe("Test reward");
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should add coins without reason", async () => {
      const result = await controller.addCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
        adminId: validAdminId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(25);
        expect(result.data.reason).toBeNull();
      }
    });

    it("should return error when group not found", async () => {
      const notFoundGateway = createMockCoinGatewayWithGroupNotFound();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        notFoundGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.addCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error when group does not belong to trip", async () => {
      const wrongTripGateway = createMockCoinGatewayWithGroupNotInTrip();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        wrongTripGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.addCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("does not belong");
      }
    });

    it("should return error when group has been deleted", async () => {
      const deletedGateway = createMockCoinGatewayWithGroupDeleted();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        deletedGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.addCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("deleted");
      }
    });
  });

  describe("removeCoins", () => {
    it("should remove coins with valid input", async () => {
      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
        reason: "Penalty for late arrival",
        adminId: validAdminId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-25);
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.adminId).toBe(validAdminId);
        expect(result.data.reason).toBe("Penalty for late arrival");
      }
    });

    it("should remove coins without reason", async () => {
      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 10,
        adminId: validAdminId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-10);
        expect(result.data.reason).toBeNull();
      }
    });

    it("should return error when group not found", async () => {
      const notFoundGateway = createMockCoinGatewayWithGroupNotFound();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        notFoundGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error when group does not belong to trip", async () => {
      const wrongTripGateway = createMockCoinGatewayWithGroupNotInTrip();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        wrongTripGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("does not belong");
      }
    });

    it("should return error when group has been deleted", async () => {
      const deletedGateway = createMockCoinGatewayWithGroupDeleted();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        deletedGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("deleted");
      }
    });

    it("should return error when group has insufficient coins", async () => {
      const insufficientGateway = createMockCoinGatewayWithInsufficientCoins();
      mockLayer = Layer.succeed(
        CoinTransactionGatewayTag,
        insufficientGateway,
      ) as Layer.Layer<unknown>;
      controller = new CoinController(mockLayer);

      const result = await controller.removeCoins({
        tripId: validTripId,
        groupId: validGroupId,
        amount: 100,
        adminId: validAdminId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("enough coins");
      }
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - CoinController.addCoins: adding coins with/without reason
 * - CoinController.removeCoins: removing coins with/without reason
 * - Error cases: group not found, wrong trip, deleted group, insufficient coins
 * - All tests use Effect Layer injection for mocking dependencies
 * - Tests follow the [UNIT] prefix convention
 *
 * Public methods tested:
 * - addCoins (2 success cases + 3 error cases)
 * - removeCoins (2 success cases + 4 error cases)
 */
