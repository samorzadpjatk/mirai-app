import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
} from "./GetCoinStatistics";
import { Effect, Either } from "effect";
import {
  CoinTransactionRepositoryTag,
  type CoinStatistics,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] getCoinStatisticsUseCase (Effect)", () => {
  // Helper to create a mock repository
  const createMockRepo = (overrides?: any) => ({
    count: mock(() => Effect.succeed(10)),
    sumAmount: mock(() => Effect.succeed(null)),
    sumAddedCoins: mock(() => Effect.succeed(1000)),
    sumRemovedCoins: mock(() => Effect.succeed(-200)),
    getMostActiveAdmin: mock(() => Effect.succeed([])),
    findMany: mock(() => Effect.succeed([])),
    findRecent: mock(() => Effect.succeed([])),
    getTotalCoinsByGroup: mock(() => Effect.succeed([])),
    groupByAdmin: mock(() => Effect.succeed([])),
    create: mock(() => Effect.succeed({} as any)),
    incrementGroupCoins: mock(() => Effect.succeed(undefined)),
    decrementGroupCoins: mock(() => Effect.succeed({ success: true })),
    getGroupCoins: mock(() => Effect.succeed(0)),
    verifyGroupInTrip: mock(() => Effect.succeed({ exists: true })),
    ...overrides,
  });

  it("should return statistics successfully", async () => {
    const mockRepo = createMockRepo();
    const input: GetCoinStatisticsInput = { tripId: "trip-1" };

    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const result = await Effect.runPromise(program);

    expect(result.transactionCount).toBe(10);
    expect(result.addedCoins).toBe(1000);
    expect(result.removedCoins).toBe(-200);
    expect(result.netBalance).toBe(800);
    expect(result.time).toBeInstanceOf(Date);
  });

  it("should handle null sums", async () => {
    const mockRepo = createMockRepo({
      sumAddedCoins: mock(() => Effect.succeed(null)),
      sumRemovedCoins: mock(() => Effect.succeed(null)),
      count: mock(() => Effect.succeed(0)),
    });

    const input: GetCoinStatisticsInput = { tripId: "trip-1" };

    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const result = await Effect.runPromise(program);

    expect(result.addedCoins).toBe(0);
    expect(result.removedCoins).toBe(0);
    expect(result.netBalance).toBe(0);
  });

  it("should return error on repository failure", async () => {
    const mockRepo = createMockRepo({
      count: mock(() => Effect.fail(new Error("Database error"))),
    });

    const input: GetCoinStatisticsInput = { tripId: "trip-1" };

    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left.message).toContain("Failed to get coin statistics");
    }
  });
});
