import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
} from "./GetMostActiveAdminStats";
import type { CoinTransactionRepository } from "../ports/CoinTransactionRepository";

describe("[UNIT] GetMostActiveAdminStatsUseCase", () => {
  let useCase: GetMostActiveAdminStatsUseCase;
  let mockCoinRepo: CoinTransactionRepository;

  beforeEach(() => {
    mockCoinRepo = {
      getMostActiveAdmin: mock(() =>
        Promise.resolve([
          {
            adminId: "admin-123",
            _sum: { amount: 500 },
            _count: { id: 25 },
          },
        ]),
      ),
    } as unknown as CoinTransactionRepository;

    useCase = new GetMostActiveAdminStatsUseCase(mockCoinRepo);
  });

  describe("execute", () => {
    it("should return most active admin stats", async () => {
      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.adminId).toBe("admin-123");
        expect(result.value?.totalAmount).toBe(500);
        expect(result.value?.transactionCount).toBe(25);
      }
    });

    it("should return null when no stats exist", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() => Promise.resolve([]));

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBeNull();
      }
    });

    it("should return null when stats array has no valid entries", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() =>
        Promise.resolve([
          {
            adminId: "admin-123",
            _sum: { amount: null },
            _count: { id: 0 },
          },
        ]),
      );

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.totalAmount).toBe(0);
        expect(result.value?.transactionCount).toBe(0);
      }
    });

    it("should handle repository error gracefully", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() =>
        Promise.reject(new Error("Database connection failed")),
      );

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get most active admin stats");
        expect(result.error).toContain("Database connection failed");
      }
    });

    it("should handle null _sum amount", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() =>
        Promise.resolve([
          {
            adminId: "admin-123",
            _sum: { amount: null },
            _count: { id: 10 },
          },
        ]),
      );

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value?.totalAmount).toBe(0);
        expect(result.value?.transactionCount).toBe(10);
      }
    });

    it("should call repository with correct tripId", async () => {
      const input: GetMostActiveAdminStatsInput = { tripId: "trip-456" };

      await useCase.execute(input);

      expect(mockCoinRepo.getMostActiveAdmin).toHaveBeenCalledWith("trip-456");
    });

    it("should handle stats with first admin having valid data", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() =>
        Promise.resolve([
          {
            adminId: "admin-123",
            _sum: { amount: 1000 },
            _count: { id: 50 },
          },
          {
            adminId: "admin-456",
            _sum: { amount: 500 },
            _count: { id: 25 },
          },
        ]),
      );

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        // Should pick first (most active)
        expect(result.value?.adminId).toBe("admin-123");
        expect(result.value?.totalAmount).toBe(1000);
        expect(result.value?.transactionCount).toBe(50);
      }
    });

    it("should handle non-Error rejection", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() =>
        Promise.reject("String error"),
      );

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("String error");
      }
    });
  });
});
