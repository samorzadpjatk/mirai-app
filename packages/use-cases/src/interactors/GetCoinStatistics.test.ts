import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetCoinStatisticsUseCase } from "./GetCoinStatistics";
import type {
  CoinTransactionRepository,
  CoinStatistics,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] GetCoinStatisticsUseCase", () => {
  let mockRepo: CoinTransactionRepository;
  let useCase: GetCoinStatisticsUseCase;

  beforeEach(() => {
    mockRepo = {
      count: mock(() => Promise.resolve(10)),
      sumAddedCoins: mock(() => Promise.resolve(1000)),
      sumRemovedCoins: mock(() => Promise.resolve(-200)),
    } as unknown as CoinTransactionRepository;

    useCase = new GetCoinStatisticsUseCase(mockRepo);
  });

  it("should return statistics successfully", async () => {
    const input = { tripId: "trip-1" };

    const result = await useCase.execute(input);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.transactionCount).toBe(10);
      expect(result.value.addedCoins).toBe(1000);
      expect(result.value.removedCoins).toBe(-200);
      expect(result.value.netBalance).toBe(800);
      expect(result.value.time).toBeInstanceOf(Date);
    }
  });

  it("should handle null sums", async () => {
    mockRepo.sumAddedCoins = mock(() => Promise.resolve(null));
    mockRepo.sumRemovedCoins = mock(() => Promise.resolve(null));
    mockRepo.count = mock(() => Promise.resolve(0));

    const input = { tripId: "trip-1" };

    const result = await useCase.execute(input);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.addedCoins).toBe(0);
      expect(result.value.removedCoins).toBe(0);
      expect(result.value.netBalance).toBe(0);
    }
  });

  it("should return error on repository failure", async () => {
    mockRepo.count = mock(() => Promise.reject(new Error("Database error")));

    const input = { tripId: "trip-1" };

    const result = await useCase.execute(input);

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error).toContain("Failed to get coin statistics");
    }
  });
});
