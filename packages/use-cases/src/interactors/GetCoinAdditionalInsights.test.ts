import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
} from "./GetCoinAdditionalInsights";
import type { CoinTransactionRepository } from "../ports/CoinTransactionRepository";
import type { CoinTransaction } from "@mirai-app/domain";

// Mock CoinTransaction
const createMockTransaction = (
  overrides?: Partial<CoinTransaction>,
): CoinTransaction =>
  ({
    id: "tx-123",
    groupId: "group-123",
    tripId: "trip-123",
    amount: 100,
    reason: "Test transaction",
    adminId: "admin-123",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as CoinTransaction;

describe("[UNIT] GetCoinAdditionalInsightsUseCase", () => {
  let useCase: GetCoinAdditionalInsightsUseCase;
  let mockCoinRepo: CoinTransactionRepository;

  beforeEach(() => {
    mockCoinRepo = {
      findRecent: mock(() =>
        Promise.resolve([
          createMockTransaction({ id: "tx-1" }),
          createMockTransaction({ id: "tx-2" }),
        ]),
      ),
      groupByAdmin: mock(() =>
        Promise.resolve([
          { adminId: "admin-1", _count: { id: 15 } },
          { adminId: "admin-2", _count: { id: 8 } },
        ]),
      ),
    } as unknown as CoinTransactionRepository;

    useCase = new GetCoinAdditionalInsightsUseCase(mockCoinRepo);
  });

  describe("execute", () => {
    it("should return insights with recent transactions and most active admin", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.mostActiveAdmin).not.toBeNull();
        expect(result.value?.mostActiveAdmin?.name).toBe("admin-1");
        expect(result.value?.mostActiveAdmin?.transactionCount).toBe(15);
        expect(result.value?.recentTransactions).toHaveLength(2);
      }
    });

    it("should use default recentLimit of 5", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };

      await useCase.execute(input);

      expect(mockCoinRepo.findRecent).toHaveBeenCalledWith(
        { tripId: "trip-123" },
        5,
      );
    });

    it("should use custom recentLimit when provided", async () => {
      const input: GetCoinAdditionalInsightsInput = {
        tripId: "trip-123",
        recentLimit: 10,
      };

      await useCase.execute(input);

      expect(mockCoinRepo.findRecent).toHaveBeenCalledWith(
        { tripId: "trip-123" },
        10,
      );
    });

    it("should return null when no data exists", async () => {
      mockCoinRepo.findRecent = mock(() => Promise.resolve([]));
      mockCoinRepo.groupByAdmin = mock(() => Promise.resolve([]));

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBeNull();
      }
    });

    it("should handle no recent transactions but have admin stats", async () => {
      mockCoinRepo.findRecent = mock(() => Promise.resolve([]));

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.recentTransactions).toEqual([]);
        expect(result.value?.mostActiveAdmin?.name).toBe("admin-1");
      }
    });

    it("should handle recent transactions but no admin stats", async () => {
      mockCoinRepo.groupByAdmin = mock(() => Promise.resolve([]));

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.mostActiveAdmin).toBeNull();
        expect(result.value?.recentTransactions).toHaveLength(2);
      }
    });

    it("should handle repository error", async () => {
      mockCoinRepo.findRecent = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get additional insights");
      }
    });

    it("should call findRecent and groupByAdmin with correct tripId", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-456" };

      await useCase.execute(input);

      expect(mockCoinRepo.findRecent).toHaveBeenCalledWith(
        { tripId: "trip-456" },
        5,
      );
      expect(mockCoinRepo.groupByAdmin).toHaveBeenCalledWith("trip-456", 1);
    });

    it("should map transactions correctly", async () => {
      mockCoinRepo.findRecent = mock(() =>
        Promise.resolve([
          createMockTransaction({ id: "tx-1", amount: 50 }),
          createMockTransaction({ id: "tx-2", amount: 100 }),
        ]),
      );

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.recentTransactions[0].id).toBe("tx-1");
        expect(result.value?.recentTransactions[0].amount).toBe(50);
        expect(result.value?.recentTransactions[1].id).toBe("tx-2");
      }
    });

    it("should return first admin as most active", async () => {
      mockCoinRepo.groupByAdmin = mock(() =>
        Promise.resolve([
          { adminId: "admin-most", _count: { id: 25 } },
          { adminId: "admin-less", _count: { id: 5 } },
        ]),
      );

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.mostActiveAdmin?.name).toBe("admin-most");
        expect(result.value?.mostActiveAdmin?.transactionCount).toBe(25);
      }
    });
  });
});
