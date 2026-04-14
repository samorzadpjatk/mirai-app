import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { CoinTransactionController } from "../coin-transaction";
import type { CoinTransactionRepository } from "@mirai-app/use-cases";

// Valid UUIDs for testing
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = "550e8400-e29b-41d4-a716-446655440001";
const ADMIN_ID = "550e8400-e29b-41d4-a716-446655440002";
const TX_ID = "550e8400-e29b-41d4-a716-446655440003";

describe("[UNIT] CoinTransactionController", () => {
  let controller: CoinTransactionController;
  let mockCoinRepository: CoinTransactionRepository;

  beforeEach(() => {
    mockCoinRepository = {
      count: mock(() => Effect.succeed(10)),
      sumAmount: mock(() => Effect.succeed(800)),
      sumAddedCoins: mock(() => Effect.succeed(1000)),
      sumRemovedCoins: mock(() => Effect.succeed(-200)),
      getMostActiveAdmin: mock(() =>
        Effect.succeed([
          {
            adminId: ADMIN_ID,
            _sum: { amount: 500 },
            _count: { id: 5 },
          },
        ]),
      ),
      findMany: mock(() =>
        Effect.succeed([
          {
            id: TX_ID,
            groupId: GROUP_ID,
            amount: 100,
            reason: "Test",
            adminId: ADMIN_ID,
            createdAt: new Date(),
            group: { id: GROUP_ID, name: "Group 1", coins: 500 },
            admin: { id: ADMIN_ID, firstName: "Admin", lastName: "User" },
          },
        ]),
      ),
      findRecent: mock(() => Effect.succeed([])),
      getTotalCoinsByGroup: mock(() =>
        Effect.succeed([{ groupId: GROUP_ID, _sum: { amount: 500 } }]),
      ),
      groupByAdmin: mock(() =>
        Effect.succeed([{ adminId: ADMIN_ID, _count: { id: 5 } }]),
      ),
      create: mock((data) =>
        Effect.succeed({
          id: TX_ID,
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
        }),
      ),
      incrementGroupCoins: mock(() => Effect.succeed(undefined)),
      decrementGroupCoins: mock(() =>
        Effect.succeed({ success: true, currentBalance: 400 }),
      ),
      getGroupCoins: mock(() => Effect.succeed(500)),
      verifyGroupInTrip: mock(() =>
        Effect.succeed({
          exists: true,
          tripId: TRIP_ID,
          isDeleted: false,
          coins: 500,
        }),
      ),
    } as unknown as CoinTransactionRepository;

    controller = new CoinTransactionController(mockCoinRepository);
  });

  describe("[UNIT] getStatistics", () => {
    it("should return statistics", async () => {
      const result = await controller.getStatistics({ tripId: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionCount).toBe(10);
        expect(result.data.addedCoins).toBe(1000);
      }
    });

    it("should return error on failure", async () => {
      mockCoinRepository.count = mock(() =>
        Effect.fail("Database error" as never),
      );

      const result = await controller.getStatistics({ tripId: TRIP_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] getAll", () => {
    it("should return paginated transactions", async () => {
      const result = await controller.getAll({
        tripId: TRIP_ID,
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions).toHaveLength(1);
        expect(result.data.pagination.total).toBe(10);
      }
    });
  });

  describe("[UNIT] getCoinTransactions", () => {
    it("should return transactions for participant", async () => {
      const result = await controller.getCoinTransactions({
        tripId: TRIP_ID,
        groupId: GROUP_ID,
        limit: 10,
        isParticipant: true,
      });

      expect(result.success).toBe(true);
    });

    it("should fail for non-participant", async () => {
      const result = await controller.getCoinTransactions({
        tripId: TRIP_ID,
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
