import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  GroupNotFoundError,
  GroupNotInTripError,
  GroupDeletedError,
  DecrementCoinsError,
  InsufficientCoinsError,
  CreateTransactionError,
} from "./remove";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";

function createMockCoinGateway(
  options: {
    groupExists?: boolean;
    groupTripId?: string;
    isDeleted?: boolean;
    decrementSuccess?: boolean;
    currentBalance?: number;
    shouldFailDecrement?: boolean;
    shouldFailCreate?: boolean;
  } = {},
): CoinTransactionGateway {
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
    }) => {
      if (options.shouldFailCreate) {
        return Effect.fail(new Error("Create failed"));
      }
      return Effect.succeed({
        id: "tx-123",
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason ?? null,
        adminId: data.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CoinTransactionDTO);
    },

    incrementGroupCoins: () => Effect.succeed(void 0),

    decrementGroupCoins: () => {
      if (options.shouldFailDecrement) {
        return Effect.fail(new Error("Decrement failed"));
      }
      return Effect.succeed({
        success: options.decrementSuccess ?? true,
        currentBalance: options.currentBalance ?? 900,
      });
    },

    getGroupCoins: () => Effect.succeed(1000),

    verifyGroupInTrip: () =>
      Effect.succeed({
        exists: options.groupExists ?? true,
        tripId: options.groupTripId ?? "trip-123",
        isDeleted: options.isDeleted ?? false,
        coins: 1000,
      }),
  };
}

describe("[UNIT] removeCoinsUseCase", () => {
  it("should remove coins successfully", async () => {
    const mockGateway = createMockCoinGateway({ decrementSuccess: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      reason: "Penalty",
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.transaction).toBeDefined();
    expect(result.transaction.amount).toBe(-100);
    expect(result.transaction.groupId).toBe("group-123");
    expect(result.transaction.adminId).toBe("admin-123");
  });

  it("should remove coins without reason", async () => {
    const mockGateway = createMockCoinGateway({ decrementSuccess: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.transaction.amount).toBe(-50);
    expect(result.transaction.reason).toBeNull();
  });

  it("should fail with GroupNotFoundError when group does not exist", async () => {
    const mockGateway = createMockCoinGateway({ groupExists: false });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "nonexistent-group",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupNotFoundError);
      expect(either.left.message).toBe("Group not found");
    }
  });

  it("should fail with GroupNotInTripError when group belongs to different trip", async () => {
    const mockGateway = createMockCoinGateway({
      groupExists: true,
      groupTripId: "different-trip",
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupNotInTripError);
      expect(either.left.message).toBe("Group does not belong to this trip");
    }
  });

  it("should fail with GroupDeletedError when group is deleted", async () => {
    const mockGateway = createMockCoinGateway({
      groupExists: true,
      isDeleted: true,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupDeletedError);
      expect(either.left.message).toBe("Group has been deleted");
    }
  });

  it("should fail with InsufficientCoinsError when group has insufficient balance", async () => {
    const mockGateway = createMockCoinGateway({
      decrementSuccess: false,
      currentBalance: 50,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InsufficientCoinsError);
      expect(either.left.message).toBe("Group does not have enough coins");
    }
  });

  it("should fail when decrement operation fails", async () => {
    const mockGateway = createMockCoinGateway({ shouldFailDecrement: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(Error);
      expect(either.left.message).toBe("Decrement failed");
    }
  });

  it("should fail when transaction creation fails", async () => {
    const mockGateway = createMockCoinGateway({
      decrementSuccess: true,
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: RemoveCoinsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 100,
      adminId: "admin-123",
    };

    const program = removeCoinsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(Error);
      expect(either.left.message).toBe("Create failed");
    }
  });
});
