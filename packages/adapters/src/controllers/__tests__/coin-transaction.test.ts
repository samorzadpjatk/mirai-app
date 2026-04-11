import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CoinTransactionController } from "../coin-transaction";
import type {
  GetCoinStatisticsUseCase,
  GetMostActiveAdminStatsUseCase,
  GetCoinTransactionsUseCase,
  GetCoinQuickStatsUseCase,
  GetCoinAdditionalInsightsUseCase,
} from "@mirai-app/use-cases";
import { ok, err } from "@mirai-app/domain";

describe("[UNIT] CoinTransactionController", () => {
  let controller: CoinTransactionController;
  let mockGetStatistics: GetCoinStatisticsUseCase;
  let mockGetMostActiveAdmin: GetMostActiveAdminStatsUseCase;
  let mockGetTransactions: GetCoinTransactionsUseCase;
  let mockGetQuickStats: GetCoinQuickStatsUseCase;
  let mockGetInsights: GetCoinAdditionalInsightsUseCase;

  beforeEach(() => {
    mockGetStatistics = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            transactionCount: 10,
            addedCoins: 1000,
            removedCoins: -200,
            netBalance: 800,
            time: new Date(),
          }),
        ),
      ),
    } as unknown as GetCoinStatisticsUseCase;

    mockGetMostActiveAdmin = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            adminId: "admin-1",
            totalAmount: 500,
            transactionCount: 5,
          }),
        ),
      ),
    } as unknown as GetMostActiveAdminStatsUseCase;

    mockGetTransactions = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            transactions: [
              {
                id: "tx-1",
                amount: 100,
                reason: "Test",
                createdAt: new Date(),
                group: { id: "group-1", name: "Group 1", coins: 500 },
                admin: { id: "admin-1", firstName: "Admin", lastName: "User" },
              },
            ],
            pagination: {
              total: 1,
              limit: 50,
              offset: 0,
              hasMore: false,
            },
          }),
        ),
      ),
    } as unknown as GetCoinTransactionsUseCase;

    mockGetQuickStats = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            totalCoins: 1000,
            totalGroups: 5,
            averageCoinsPerGroup: 200,
            time: new Date(),
          }),
        ),
      ),
    } as unknown as GetCoinQuickStatsUseCase;

    mockGetInsights = {
      execute: mock(() =>
        Promise.resolve(
          ok({
            mostActiveAdmin: {
              name: "admin-1",
              transactionCount: 5,
            },
            recentTransactions: [],
          }),
        ),
      ),
    } as unknown as GetCoinAdditionalInsightsUseCase;

    controller = new CoinTransactionController(
      mockGetStatistics,
      mockGetMostActiveAdmin,
      mockGetTransactions,
      mockGetQuickStats,
      mockGetInsights,
    );
  });

  describe("getStatistics", () => {
    it("should return statistics", async () => {
      const result = await controller.getStatistics({ tripId: "trip-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionCount).toBe(10);
        expect(result.data.addedCoins).toBe(1000);
      }
    });

    it("should return error on failure", async () => {
      mockGetStatistics.execute = mock(() =>
        Promise.resolve(err("Failed to get stats")),
      );

      const result = await controller.getStatistics({ tripId: "trip-1" });

      expect(result.success).toBe(false);
    });
  });

  describe("getAll", () => {
    it("should return paginated transactions", async () => {
      const result = await controller.getAll({
        tripId: "trip-1",
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions).toHaveLength(1);
        expect(result.data.pagination.total).toBe(1);
      }
    });
  });

  describe("getCoinTransactions", () => {
    it("should return transactions for participant", async () => {
      const result = await controller.getCoinTransactions({
        tripId: "trip-1",
        groupId: "group-1",
        limit: 10,
        isParticipant: true,
      });

      expect(result.success).toBe(true);
    });

    it("should fail for non-participant", async () => {
      const result = await controller.getCoinTransactions({
        tripId: "trip-1",
        limit: 10,
        isParticipant: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not a participant");
      }
    });
  });
});
