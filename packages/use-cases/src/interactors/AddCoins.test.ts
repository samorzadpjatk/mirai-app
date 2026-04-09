import { describe, it, expect, beforeEach } from "bun:test";
import { AddCoinsUseCase } from "./AddCoins";
import { InMemoryCoinTransactionRepository } from "@mirai-app/adapters/test-utils";

describe("[UNIT] AddCoinsUseCase", () => {
  let repo: InMemoryCoinTransactionRepository;
  let useCase: AddCoinsUseCase;

  beforeEach(() => {
    repo = new InMemoryCoinTransactionRepository();
    useCase = new AddCoinsUseCase(repo);
  });

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
    const result = await useCase.execute(input);

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
    const result = await useCase.execute(input);

    // Assert
    expect(result.transaction.reason).toBeNull();
    expect(result.transaction.amount).toBe(50);

    // Verify group coins were incremented
    const groupCoins = await repo.getGroupCoins("group-1");
    expect(groupCoins).toBe(100);
  });
});
