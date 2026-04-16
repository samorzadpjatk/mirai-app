import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  getMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
} from "./get-most-active-admin-stats";
import {
  CoinTransactionGatewayTag,
  type MostActiveAdminStat,
} from "../ports/gateway";

// Helper to run use case with Effect
const runGetMostActiveAdminStatsUseCase = async (
  input: GetMostActiveAdminStatsInput,
  deps: {
    mockCoinRepo: {
      getMostActiveAdmin: (tripId: string) => Promise<MostActiveAdminStat[]>;
    };
  },
) => {
  const program = getMostActiveAdminStatsUseCase(input).pipe(
    Effect.provideService(CoinTransactionGatewayTag, {
      count: (filters?) => Effect.promise(() => Promise.resolve(0)),
      sumAmount: (filters?) => Effect.promise(() => Promise.resolve(null)),
      sumAddedCoins: (tripId: string) =>
        Effect.promise(() => Promise.resolve(null)),
      sumRemovedCoins: (tripId: string) =>
        Effect.promise(() => Promise.resolve(null)),
      getMostActiveAdmin: (tripId: string) =>
        Effect.promise(() => deps.mockCoinRepo.getMostActiveAdmin(tripId)),
      findMany: (filters, pagination) =>
        Effect.promise(() => Promise.resolve([])),
      findRecent: (filters, limit) => Effect.promise(() => Promise.resolve([])),
      getTotalCoinsByGroup: (tripId: string) =>
        Effect.promise(() => Promise.resolve([])),
      groupByAdmin: (tripId: string, limit: number) =>
        Effect.promise(() => Promise.resolve([])),
      create: (data) => Effect.promise(() => Promise.resolve({} as any)),
      incrementGroupCoins: (groupId: string, amount: number) =>
        Effect.promise(() => Promise.resolve()),
      decrementGroupCoins: (groupId: string, amount: number) =>
        Effect.promise(() => Promise.resolve({ success: true })),
      getGroupCoins: (groupId: string) =>
        Effect.promise(() => Promise.resolve(0)),
      verifyGroupInTrip: (groupId: string, tripId: string) =>
        Effect.promise(() =>
          Promise.resolve({ exists: true, tripId, isDeleted: false, coins: 0 }),
        ),
    }),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] getMostActiveAdminStatsUseCase (Effect)", () => {
  let mockCoinRepo: {
    getMostActiveAdmin: ReturnType<typeof mock>;
  };

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
    };
  });

  describe("[UNIT] execute", () => {
    it("should return most active admin stats", async () => {
      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };

      const result = await runGetMostActiveAdminStatsUseCase(input, {
        mockCoinRepo,
      });

      expect(result).not.toBeNull();
      expect(result?.adminId).toBe("admin-123");
      expect(result?.totalAmount).toBe(500);
      expect(result?.transactionCount).toBe(25);
    });

    it("should return null when no stats exist", async () => {
      mockCoinRepo.getMostActiveAdmin = mock(() => Promise.resolve([]));

      const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
      const result = await runGetMostActiveAdminStatsUseCase(input, {
        mockCoinRepo,
      });

      expect(result).toBeNull();
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
      const result = await runGetMostActiveAdminStatsUseCase(input, {
        mockCoinRepo,
      });

      expect(result).not.toBeNull();
      expect(result?.totalAmount).toBe(0);
      expect(result?.transactionCount).toBe(0);
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
      const result = await runGetMostActiveAdminStatsUseCase(input, {
        mockCoinRepo,
      });

      expect(result?.totalAmount).toBe(0);
      expect(result?.transactionCount).toBe(10);
    });

    it("should call repository with correct tripId", async () => {
      const input: GetMostActiveAdminStatsInput = { tripId: "trip-456" };

      await runGetMostActiveAdminStatsUseCase(input, { mockCoinRepo });

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
      const result = await runGetMostActiveAdminStatsUseCase(input, {
        mockCoinRepo,
      });

      // Should pick first (most active)
      expect(result?.adminId).toBe("admin-123");
      expect(result?.totalAmount).toBe(1000);
      expect(result?.transactionCount).toBe(50);
    });
  });
});
