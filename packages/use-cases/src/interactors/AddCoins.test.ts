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

  // Helper to create a service wrapper from the in-memory repo
  const createRepoService = (repo: InMemoryCoinTransactionRepository) => ({
    count: (filters?: any) => Effect.promise(() => repo.count(filters)),
    sumAmount: (filters?: any) => Effect.promise(() => repo.sumAmount(filters)),
    sumAddedCoins: (tripId: string) =>
      Effect.promise(() => repo.sumAddedCoins(tripId)),
    sumRemovedCoins: (tripId: string) =>
      Effect.promise(() => repo.sumRemovedCoins(tripId)),
    getMostActiveAdmin: (tripId: string) =>
      Effect.promise(() => repo.getMostActiveAdmin(tripId)),
    findMany: (filters: any, pagination: any) =>
      Effect.promise(() => repo.findMany(filters, pagination)),
    findRecent: (filters: any, limit: number) =>
      Effect.promise(() => repo.findRecent(filters, limit)),
    getTotalCoinsByGroup: (tripId: string) =>
      Effect.promise(() => repo.getTotalCoinsByGroup(tripId)),
    groupByAdmin: (tripId: string, limit: number) =>
      Effect.promise(() => repo.groupByAdmin(tripId, limit)),
    create: (data: any) => Effect.promise(() => repo.create(data)),
    incrementGroupCoins: (groupId: string, amount: number) =>
      Effect.promise(() => repo.incrementGroupCoins(groupId, amount)),
    decrementGroupCoins: (groupId: string, amount: number) =>
      Effect.promise(() => repo.decrementGroupCoins(groupId, amount)),
    getGroupCoins: (groupId: string) =>
      Effect.promise(() => repo.getGroupCoins(groupId)),
    verifyGroupInTrip: (groupId: string, tripId: string) =>
      Effect.promise(() => repo.verifyGroupInTrip(groupId, tripId)),
  });

  beforeEach(() => {
    repo = new InMemoryCoinTransactionRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: AddCoinsInput) => {
    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(
        CoinTransactionRepositoryTag,
        createRepoService(repo),
      ),
    );
    return await Effect.runPromise(program);
  };

  it("should add coins successfully", async () => {
    // Arrange - seed group coins for the verification to pass
    repo.seedGroupCoins("group-1", 0);

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      reason: "Test reason",
      adminId: "admin-1",
    };

    // Act
    const result = await runUseCase(input);

    // Assert
    expect(result.transaction.amount).toBe(100);
    expect(result.transaction.groupId).toBe("group-1");

    // Verify group coins were incremented
    const groupCoins = await repo.getGroupCoins("group-1");
    expect(groupCoins).toBe(100);
  });

  it("should work without reason", async () => {
    // Arrange
    repo.seedGroupCoins("group-1", 50);

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 50,
      adminId: "admin-1",
    };

    // Act
    const result = await runUseCase(input);

    // Assert
    expect(result.transaction.reason).toBeNull();
    expect(result.transaction.amount).toBe(50);

    // Verify group coins were incremented
    const groupCoins = await repo.getGroupCoins("group-1");
    expect(groupCoins).toBe(100);
  });

  it("should fail when group not found", async () => {
    // Override verifyGroupInTrip to return not found
    repo.verifyGroupInTrip = async () => ({ exists: false });

    const input = {
      tripId: "trip-1",
      groupId: "nonexistent",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(
        CoinTransactionRepositoryTag,
        createRepoService(repo),
      ),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupNotFoundError);
    }
  });

  it("should fail when group is deleted", async () => {
    // Override verifyGroupInTrip to return deleted
    repo.verifyGroupInTrip = async () => ({
      exists: true,
      tripId: "trip-1",
      isDeleted: true,
    });

    const input = {
      tripId: "trip-1",
      groupId: "deleted-group",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(
        CoinTransactionRepositoryTag,
        createRepoService(repo),
      ),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupDeletedError);
    }
  });

  it("should fail when group not in trip", async () => {
    // Override verifyGroupInTrip to return wrong trip
    repo.verifyGroupInTrip = async () => ({
      exists: true,
      tripId: "wrong-trip",
      isDeleted: false,
    });

    const input = {
      tripId: "trip-1",
      groupId: "group-other",
      amount: 100,
      adminId: "admin-1",
    };

    const program = addCoinsUseCase(input).pipe(
      Effect.provideService(
        CoinTransactionRepositoryTag,
        createRepoService(repo),
      ),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GroupNotInTripError);
    }
  });
});
