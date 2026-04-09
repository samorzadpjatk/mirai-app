import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RemoveCoinsUseCase } from "./RemoveCoins";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] RemoveCoinsUseCase", () => {
  let mockRepo: CoinTransactionRepository;
  let useCase: RemoveCoinsUseCase;

  beforeEach(() => {
    mockRepo = {
      verifyGroupInTrip: mock(() =>
        Promise.resolve({
          exists: true,
          tripId: "trip-1",
          isDeleted: false,
          coins: 500,
        }),
      ),
      decrementGroupCoins: mock(() =>
        Promise.resolve({ success: true, currentBalance: 400 }),
      ),
      create: mock((data) =>
        Promise.resolve({
          id: "tx-1",
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
        } as CoinTransaction),
      ),
    } as unknown as CoinTransactionRepository;

    useCase = new RemoveCoinsUseCase(mockRepo);
  });

  it("should remove coins successfully", async () => {
    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      reason: "Test removal",
      adminId: "admin-1",
    };

    const result = await useCase.execute(input);

    expect(result.transaction.amount).toBe(-100); // Negative for removal
    expect(result.transaction.groupId).toBe("group-1");
  });

  it("should return error when group not found", async () => {
    mockRepo.verifyGroupInTrip = mock(() => Promise.resolve({ exists: false }));

    const input = {
      tripId: "trip-1",
      groupId: "nonexistent",
      amount: 100,
      adminId: "admin-1",
    };

    await expect(useCase.execute(input)).rejects.toThrow("Group not found");
  });

  it("should return error when group has insufficient balance", async () => {
    mockRepo.decrementGroupCoins = mock(() =>
      Promise.resolve({ success: false, currentBalance: 50 }),
    );

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 100,
      adminId: "admin-1",
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      "not have enough coins",
    );
  });

  it("should return error when group is deleted", async () => {
    mockRepo.verifyGroupInTrip = mock(() =>
      Promise.resolve({ exists: true, tripId: "trip-1", isDeleted: true }),
    );

    const input = {
      tripId: "trip-1",
      groupId: "deleted-group",
      amount: 50,
      adminId: "admin-1",
    };

    await expect(useCase.execute(input)).rejects.toThrow("deleted");
  });

  it("should create transaction with negative amount", async () => {
    const createMock = mock((data) =>
      Promise.resolve({
        id: "tx-1",
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason,
        adminId: data.adminId,
        createdAt: new Date(),
      } as CoinTransaction),
    );
    mockRepo.create = createMock;

    const input = {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 75,
      adminId: "admin-1",
    };

    await useCase.execute(input);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -75,
        groupId: "group-1",
      }),
    );
  });
});
