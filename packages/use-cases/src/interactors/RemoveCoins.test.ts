import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  GroupNotFoundError,
  InsufficientCoinsError,
  GroupDeletedError,
} from "./RemoveCoins";
import { Effect, Either } from "effect";
import {
  CoinTransactionRepositoryTag,
  type CoinTransaction,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] removeCoinsUseCase (Effect)", () => {
  // Helper to create a mock repository
  const createMockRepo = (overrides?: any) => ({
    count: mock(() => Effect.succeed(0)),
    sumAmount: mock(() => Effect.succeed(null)),
    sumAddedCoins: mock(() => Effect.succeed(null)),
    sumRemovedCoins: mock(() => Effect.succeed(null)),
    getMostActiveAdmin: mock(() => Effect.succeed([])),
    findMany: mock(() => Effect.succeed([])),
    findRecent: mock(() => Effect.succeed([])),
    getTotalCoinsByGroup: mock(() => Effect.succeed([])),
    groupByAdmin: mock(() => Effect.succeed([])),
    create: mock((data: any) =>
      Effect.succeed({
        id: "tx-1",
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason ?? null,
        adminId: data.adminId,
        createdAt: new Date(),
      } as CoinTransaction),
    ),
    incrementGroupCoins: mock(() => Effect.succeed(undefined)),
    decrementGroupCoins: mock(() =>
      Effect.succeed({ success: true, currentBalance: 400 }),
    ),
    getGroupCoins: mock(() => Effect.succeed(500)),
    verifyGroupInTrip: mock(() =>
      Effect.succeed({
        exists: true,
        tripId: "trip-1",
        isDeleted: false,
        coins: 500,
      }),
    ),
    ...overrides,
  });

  it("should remove coins successfully", async () => {
    const mockRepo = createMockRepo();
    const input: RemoveCoinsInput = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      reason: "Test removal",
      adminId: "admin-1",
    };

    const program = removeCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const result = await Effect.runPromise(program);

    expect(result.transaction.amount).toBe(-100);
    expect(result.transaction.groupId).toBe("group-1");
  });

  it("should return error when group not found", async () => {
    const mockRepo = createMockRepo({
      verifyGroupInTrip: mock(() => Effect.succeed({ exists: false })),
    });

    const input: RemoveCoinsInput = {
      tripId: "trip-1",
      groupId: "nonexistent",
      amount: 100,
      adminId: "admin-1",
    };

    const program = removeCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupNotFoundError);
    }
  });

  it("should return error when group has insufficient balance", async () => {
    const mockRepo = createMockRepo({
      decrementGroupCoins: mock(() =>
        Effect.succeed({ success: false, currentBalance: 50 }),
      ),
    });

    const input: RemoveCoinsInput = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      adminId: "admin-1",
    };

    const program = removeCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(InsufficientCoinsError);
    }
  });

  it("should return error when group is deleted", async () => {
    const mockRepo = createMockRepo({
      verifyGroupInTrip: mock(() =>
        Effect.succeed({ exists: true, tripId: "trip-1", isDeleted: true }),
      ),
    });

    const input: RemoveCoinsInput = {
      tripId: "trip-1",
      groupId: "deleted-group",
      amount: 50,
      adminId: "admin-1",
    };

    const program = removeCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupDeletedError);
    }
  });

  it("should create transaction with negative amount", async () => {
    const createMock = mock((data: any) =>
      Effect.succeed({
        id: "tx-1",
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason,
        adminId: data.adminId,
        createdAt: new Date(),
      } as CoinTransaction),
    );

    const mockRepo = createMockRepo({ create: createMock });

    const input: RemoveCoinsInput = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 75,
      adminId: "admin-1",
    };

    const program = removeCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    await Effect.runPromise(program);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -75,
        groupId: "group-1",
      }),
    );
  });
});
