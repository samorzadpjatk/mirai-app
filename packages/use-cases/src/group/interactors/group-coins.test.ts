import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { GroupCoinsInteractor } from "./group-coins";
import { UseCaseError } from "../../system/errors";

/**
 * Mock DrizzleDb for testing
 */
function createMockDrizzleDb(
  options: {
    groupCoins?: number;
    shouldFailSelect?: boolean;
    shouldFailTransaction?: boolean;
    tripId?: string;
  } = {},
) {
  const groups = new Map<
    string,
    { id: string; coins: number; tripId: string }
  >();
  const transactions: Array<{
    groupId: string;
    tripId: string;
    amount: number;
    reason: string;
    adminId: string;
  }> = [];

  // Initialize with a default group
  groups.set("group-123", {
    id: "group-123",
    coins: options.groupCoins ?? 100,
    tripId: options.tripId ?? "trip-123",
  });

  return {
    query: {
      groups: {
        findFirst: async ({ where }: { where: { id: string } }) => {
          if (options.shouldFailSelect) {
            throw new Error("Database connection failed");
          }
          const group = groups.get(where.id);
          return group || null;
        },
      },
    },

    select: () => ({
      from: () => ({
        where: () => ({
          limit: async (n: number) => {
            if (options.shouldFailSelect) {
              throw new Error("Database connection failed");
            }
            const group = groups.get("group-123");
            return group ? [group].slice(0, n) : [];
          },
        }),
      }),
    }),

    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      if (options.shouldFailTransaction) {
        throw new Error("Transaction failed");
      }
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async (n: number) => {
                const group = groups.get("group-123");
                return group ? [group].slice(0, n) : [];
              },
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: ({ id }: { id: string }) => {
              const group = groups.get(id);
              if (group) {
                // Simulate coin update
                groups.set(id, group);
              }
              return { execute: async () => {} };
            },
          }),
        }),
        insert: (table: unknown) => ({
          values: (data: unknown) => {
            transactions.push(data as (typeof transactions)[0]);
            return { execute: async () => {} };
          },
        }),
      };
      await fn(tx);
    },

    // Helper to get transaction count
    getTransactionCount: () => transactions.length,

    // Helper to get group coins
    getGroupCoins: (groupId: string) => groups.get(groupId)?.coins ?? 0,
  };
}

describe("[UNIT] GroupCoinsInteractor", () => {
  describe("getBalance", () => {
    it("should return group coin balance successfully", async () => {
      const mockDb = createMockDrizzleDb({ groupCoins: 500 });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.getBalance("group-123");
      const result = await Effect.runPromise(program);

      expect(result).toBe(500);
    });

    it("should return 0 when group has no coins", async () => {
      const mockDb = createMockDrizzleDb({ groupCoins: 0 });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.getBalance("group-123");
      const result = await Effect.runPromise(program);

      expect(result).toBe(0);
    });

    it("should return 0 when group not found", async () => {
      const mockDb = createMockDrizzleDb({});
      // Override to return empty result for non-existent group
      const customDb = {
        ...mockDb,
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      };
      const interactor = new GroupCoinsInteractor(customDb as unknown as never);

      const program = interactor.getBalance("non-existent-group");
      const result = await Effect.runPromise(program);

      expect(result).toBe(0);
    });

    it("should fail with UseCaseError on database error", async () => {
      const mockDb = createMockDrizzleDb({ shouldFailSelect: true });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.getBalance("group-123");
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        expect(either.left.operation).toBe("getBalance");
      }
    });
  });

  describe("deductCoins", () => {
    it("should deduct coins from group successfully", async () => {
      const mockDb = createMockDrizzleDb({
        groupCoins: 100,
        tripId: "trip-123",
      });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.deductCoins(
        "group-123",
        50,
        "Purchase reward",
        "admin-123",
      );
      await Effect.runPromise(program);

      // Transaction should have been recorded
      expect(mockDb.getTransactionCount()).toBe(1);
    });

    it("should handle zero amount deduction", async () => {
      const mockDb = createMockDrizzleDb({ groupCoins: 100 });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.deductCoins(
        "group-123",
        0,
        "Zero deduction",
        "admin-123",
      );
      await Effect.runPromise(program);

      expect(mockDb.getTransactionCount()).toBe(1);
    });

    it("should fail with UseCaseError on transaction failure", async () => {
      const mockDb = createMockDrizzleDb({ shouldFailTransaction: true });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.deductCoins(
        "group-123",
        50,
        "Purchase reward",
        "admin-123",
      );
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        expect(either.left.operation).toBe("deductCoins");
      }
    });
  });

  describe("addCoins", () => {
    it("should add coins to group successfully", async () => {
      const mockDb = createMockDrizzleDb({
        groupCoins: 100,
        tripId: "trip-123",
      });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.addCoins(
        "group-123",
        50,
        "Bonus coins",
        "admin-123",
      );
      await Effect.runPromise(program);

      // Transaction should have been recorded
      expect(mockDb.getTransactionCount()).toBe(1);
    });

    it("should handle zero amount addition", async () => {
      const mockDb = createMockDrizzleDb({ groupCoins: 100 });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.addCoins(
        "group-123",
        0,
        "Zero addition",
        "admin-123",
      );
      await Effect.runPromise(program);

      expect(mockDb.getTransactionCount()).toBe(1);
    });

    it("should fail with UseCaseError on transaction failure", async () => {
      const mockDb = createMockDrizzleDb({ shouldFailTransaction: true });
      const interactor = new GroupCoinsInteractor(mockDb as unknown as never);

      const program = interactor.addCoins(
        "group-123",
        50,
        "Bonus coins",
        "admin-123",
      );
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        expect(either.left.operation).toBe("addCoins");
      }
    });
  });
});
