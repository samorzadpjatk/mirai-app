import { describe, it, expect, beforeEach } from "bun:test";
import {
  addCoinsUseCase,
  type AddCoinsInput,
  GroupNotFoundError,
  GroupNotInTripError,
  GroupDeletedError,
} from "./AddCoins";
import { Effect, Either } from "effect";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import { InMemoryCoinTransactionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] addCoinsUseCase (Effect)", () => {
  let repo: InMemoryCoinTransactionRepository;

  beforeEach(() => {
    repo = new InMemoryCoinTransactionRepository();
  });

  const runUseCase = async (input: AddCoinsInput) => {
    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, {
        count: (filters?: any) => repo.count(filters),
        sumAmount: (filters?: any) => repo.sumAmount(filters),
        sumAddedCoins: (tripId: string) => repo.sumAddedCoins(tripId),
        sumRemovedCoins: (tripId: string) => repo.sumRemovedCoins(tripId),
        getMostActiveAdmin: (tripId: string) => repo.getMostActiveAdmin(tripId),
        findMany: (filters: any, pagination: any) =>
          repo.findMany(filters, pagination),
        findRecent: (filters: any, limit: number) =>
          repo.findRecent(filters, limit),
        getTotalCoinsByGroup: (tripId: string) =>
          repo.getTotalCoinsByGroup(tripId),
        groupByAdmin: (tripId: string, limit: number) =>
          repo.groupByAdmin(tripId, limit),
        create: (data: any) => repo.create(data),
        incrementGroupCoins: (groupId: string, amount: number) =>
          repo.incrementGroupCoins(groupId, amount),
        decrementGroupCoins: (groupId: string, amount: number) =>
          repo.decrementGroupCoins(groupId, amount),
        getGroupCoins: (groupId: string) => repo.getGroupCoins(groupId),
        verifyGroupInTrip: (groupId: string, tripId: string) =>
          repo.verifyGroupInTrip(groupId, tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  it("should add coins successfully", async () => {
    repo.seedGroupCoins("group-1", 0);

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      reason: "Test reason",
      adminId: "admin-1",
    };

    const result = await runUseCase(input);

    expect(result.transaction.amount).toBe(100);
    expect(result.transaction.groupId).toBe("group-1");

    const groupCoins = await Effect.runPromise(repo.getGroupCoins("group-1"));
    expect(groupCoins).toBe(100);
  });

  it("should work without reason", async () => {
    repo.seedGroupCoins("group-1", 50);

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 50,
      adminId: "admin-1",
    };

    const result = await runUseCase(input);

    expect(result.transaction.reason).toBeNull();
    expect(result.transaction.amount).toBe(50);

    const groupCoins = await Effect.runPromise(repo.getGroupCoins("group-1"));
    expect(groupCoins).toBe(100);
  });

  it("should fail when group not found", async () => {
    const mockRepo = {
      count: (filters?: any) => Effect.succeed(0),
      sumAmount: (filters?: any) => Effect.succeed(null),
      sumAddedCoins: (tripId: string) => Effect.succeed(null),
      sumRemovedCoins: (tripId: string) => Effect.succeed(null),
      getMostActiveAdmin: (tripId: string) => Effect.succeed([]),
      findMany: (filters: any, pagination: any) => Effect.succeed([]),
      findRecent: (filters: any, limit: number) => Effect.succeed([]),
      getTotalCoinsByGroup: (tripId: string) => Effect.succeed([]),
      groupByAdmin: (tripId: string, limit: number) => Effect.succeed([]),
      create: (data: any) =>
        Effect.succeed({
          id: "tx-1",
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
        }),
      incrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed(undefined),
      decrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed({ success: true, currentBalance: 400 }),
      getGroupCoins: (groupId: string) => Effect.succeed(500),
      verifyGroupInTrip: () => Effect.succeed({ exists: false }),
    };

    const input = {
      tripId: "trip-1",
      groupId: "nonexistent",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupNotFoundError);
    }
  });

  it("should fail when group is deleted", async () => {
    const mockRepo = {
      count: (filters?: any) => Effect.succeed(0),
      sumAmount: (filters?: any) => Effect.succeed(null),
      sumAddedCoins: (tripId: string) => Effect.succeed(null),
      sumRemovedCoins: (tripId: string) => Effect.succeed(null),
      getMostActiveAdmin: (tripId: string) => Effect.succeed([]),
      findMany: (filters: any, pagination: any) => Effect.succeed([]),
      findRecent: (filters: any, limit: number) => Effect.succeed([]),
      getTotalCoinsByGroup: (tripId: string) => Effect.succeed([]),
      groupByAdmin: (tripId: string, limit: number) => Effect.succeed([]),
      create: (data: any) =>
        Effect.succeed({
          id: "tx-1",
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
        }),
      incrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed(undefined),
      decrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed({ success: true, currentBalance: 400 }),
      getGroupCoins: (groupId: string) => Effect.succeed(500),
      verifyGroupInTrip: () =>
        Effect.succeed({
          exists: true,
          tripId: "trip-1",
          isDeleted: true,
        }),
    };

    const input = {
      tripId: "trip-1",
      groupId: "deleted-group",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupDeletedError);
    }
  });

  it("should fail when group not in trip", async () => {
    const mockRepo = {
      count: (filters?: any) => Effect.succeed(0),
      sumAmount: (filters?: any) => Effect.succeed(null),
      sumAddedCoins: (tripId: string) => Effect.succeed(null),
      sumRemovedCoins: (tripId: string) => Effect.succeed(null),
      getMostActiveAdmin: (tripId: string) => Effect.succeed([]),
      findMany: (filters: any, pagination: any) => Effect.succeed([]),
      findRecent: (filters: any, limit: number) => Effect.succeed([]),
      getTotalCoinsByGroup: (tripId: string) => Effect.succeed([]),
      groupByAdmin: (tripId: string, limit: number) => Effect.succeed([]),
      create: (data: any) =>
        Effect.succeed({
          id: "tx-1",
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
        }),
      incrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed(undefined),
      decrementGroupCoins: (groupId: string, amount: number) =>
        Effect.succeed({ success: true, currentBalance: 400 }),
      getGroupCoins: (groupId: string) => Effect.succeed(500),
      verifyGroupInTrip: () =>
        Effect.succeed({
          exists: true,
          tripId: "wrong-trip",
          isDeleted: false,
        }),
    };

    const input = {
      tripId: "trip-1",
      groupId: "group-other",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupNotInTripError);
    }
  });
});
