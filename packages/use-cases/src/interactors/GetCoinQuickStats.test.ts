import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
} from "./GetCoinQuickStats";
import type { CoinTransactionRepository } from "../ports/CoinTransactionRepository";

describe("[UNIT] GetCoinQuickStatsUseCase", () => {
  let useCase: GetCoinQuickStatsUseCase;
  let mockCoinRepo: CoinTransactionRepository;

  beforeEach(() => {
    mockCoinRepo = {
      sumAmount: mock(() => Promise.resolve(1000)),
      count: mock(() => Promise.resolve(10)),
      getTotalCoinsByGroup: mock(() =>
        Promise.resolve([
          { groupId: "group-1", _sum: { amount: 500 } },
          { groupId: "group-2", _sum: { amount: 300 } },
          { groupId: "group-3", _sum: { amount: 200 } },
        ]),
      ),
    } as unknown as CoinTransactionRepository;

    useCase = new GetCoinQuickStatsUseCase(mockCoinRepo);
  });

  describe("execute", () => {
    it("should return quick stats for trip", async () => {
      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.totalCoins).toBe(1000);
        expect(result.value?.totalGroups).toBe(10);
        expect(result.value?.averageCoinsPerGroup).toBe(100);
        expect(result.value?.richestGroupId).toBe("group-1");
        expect(result.value?.time).toBeInstanceOf(Date);
      }
    });

    it("should return null when no transactions exist", async () => {
      mockCoinRepo.sumAmount = mock(() => Promise.resolve(null));

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBeNull();
      }
    });

    it("should calculate average correctly", async () => {
      mockCoinRepo.sumAmount = mock(() => Promise.resolve(500));
      mockCoinRepo.count = mock(() => Promise.resolve(5));

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.averageCoinsPerGroup).toBe(100); // 500/5
      }
    });

    it("should handle zero groups", async () => {
      mockCoinRepo.sumAmount = mock(() => Promise.resolve(0));
      mockCoinRepo.count = mock(() => Promise.resolve(0));

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.averageCoinsPerGroup).toBe(0);
      }
    });

    it("should handle groups without richest info", async () => {
      mockCoinRepo.getTotalCoinsByGroup = mock(() => Promise.resolve([]));

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.richestGroupId).toBeUndefined();
        expect(result.value?.totalCoins).toBe(1000);
      }
    });

    it("should handle repository error", async () => {
      mockCoinRepo.sumAmount = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get quick stats");
        expect(result.error).toContain("Database error");
      }
    });

    it("should find richest group correctly", async () => {
      mockCoinRepo.getTotalCoinsByGroup = mock(() =>
        Promise.resolve([
          { groupId: "group-a", _sum: { amount: 100 } },
          { groupId: "group-b", _sum: { amount: 800 } },
          { groupId: "group-c", _sum: { amount: 50 } },
        ]),
      );

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.richestGroupId).toBe("group-b");
      }
    });

    it("should handle null amounts in group data", async () => {
      mockCoinRepo.getTotalCoinsByGroup = mock(() =>
        Promise.resolve([
          { groupId: "group-1", _sum: { amount: null } },
          { groupId: "group-2", _sum: { amount: 300 } },
        ]),
      );

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.richestGroupId).toBe("group-2");
      }
    });

    it("should call sumAmount with tripId filter", async () => {
      const input: GetCoinQuickStatsInput = { tripId: "trip-456" };

      await useCase.execute(input);

      expect(mockCoinRepo.sumAmount).toHaveBeenCalledWith({
        tripId: "trip-456",
      });
    });

    it("should call count with tripId filter", async () => {
      const input: GetCoinQuickStatsInput = { tripId: "trip-456" };

      await useCase.execute(input);

      expect(mockCoinRepo.count).toHaveBeenCalledWith({ tripId: "trip-456" });
    });
  });
});
