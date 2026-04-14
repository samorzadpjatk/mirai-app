import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { CoinController } from "../coin";
import type { CoinTransactionRepository } from "@mirai-app/use-cases";

// Valid UUIDs for testing
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = "550e8400-e29b-41d4-a716-446655440001";
const ADMIN_ID = "550e8400-e29b-41d4-a716-446655440002";
const TX_ID = "550e8400-e29b-41d4-a716-446655440003";

describe("[UNIT] CoinController", () => {
  let controller: CoinController;
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
      getTotalCoinsByGroup: mock(() => Effect.succeed([])),
      groupByAdmin: mock(() => Effect.succeed([])),
      create: mock((data) =>
        Effect.succeed({
          id: TX_ID,
          groupId: data.groupId,
          amount: data.amount,
          reason: data.reason ?? null,
          adminId: data.adminId,
          createdAt: new Date(),
          group: { id: data.groupId, name: "Group 1", coins: 500 },
          admin: { id: data.adminId, firstName: "Admin", lastName: "User" },
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

    controller = new CoinController(mockCoinRepository);
  });

  describe("[UNIT] addCoins", () => {
    it("should add coins successfully", async () => {
      const input = {
        tripId: TRIP_ID,
        groupId: GROUP_ID,
        amount: 100,
        reason: "Test",
        adminId: ADMIN_ID,
      };

      const result = await controller.addCoins(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100);
      }
    });

    it("should return error when use case fails", async () => {
      mockCoinRepository.verifyGroupInTrip = mock(() =>
        Effect.succeed({
          exists: false,
          tripId: TRIP_ID,
          isDeleted: false,
          coins: 0,
        }),
      );

      const input = {
        tripId: TRIP_ID,
        groupId: "550e8400-e29b-41d4-a716-446655440099",
        amount: 100,
        adminId: ADMIN_ID,
      };

      const result = await controller.addCoins(input);

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] removeCoins", () => {
    it("should remove coins successfully", async () => {
      const input = {
        tripId: TRIP_ID,
        groupId: GROUP_ID,
        amount: 50,
        reason: "Test removal",
        adminId: ADMIN_ID,
      };

      const result = await controller.removeCoins(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-50);
      }
    });

    it("should return error when group does not have enough coins", async () => {
      mockCoinRepository.decrementGroupCoins = mock(() =>
        Effect.succeed({ success: false, currentBalance: 10 }),
      );

      const input = {
        tripId: TRIP_ID,
        groupId: GROUP_ID,
        amount: 1000,
        adminId: ADMIN_ID,
      };

      const result = await controller.removeCoins(input);

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] schemas", () => {
    it("should expose validation schemas", () => {
      expect(controller.schemas.addCoins).toBeDefined();
      expect(controller.schemas.removeCoins).toBeDefined();
    });
  });
});
