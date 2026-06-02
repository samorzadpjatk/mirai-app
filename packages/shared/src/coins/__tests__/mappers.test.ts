import { describe, it, expect } from "vitest";
import { mapToMostActiveAdminStats, buildAdditionalInsights } from "../mappers";
import type { MostActiveAdminStatRow, RecentTransaction } from "../mappers";

const createMockRow = (
  overrides: Partial<MostActiveAdminStatRow> = {},
): MostActiveAdminStatRow => ({
  adminId: "admin-123",
  totalAmount: 100,
  count: 5,
  ...overrides,
});

const createMockTransaction = (
  overrides: Partial<RecentTransaction> = {},
): RecentTransaction => ({
  id: "tx-123",
  amount: 50,
  reason: "Bonus",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  group: { name: "Group A" },
  ...overrides,
});

describe("mapToMostActiveAdminStats", () => {
  it("maps a single row to the correct stat shape", () => {
    const rows = [createMockRow()];
    const result = mapToMostActiveAdminStats(rows);
    expect(result).toEqual([
      {
        adminId: "admin-123",
        _sum: { amount: 100 },
        _count: { id: 5 },
      },
    ]);
  });

  it("maps multiple rows to the correct stat shapes", () => {
    const rows = [
      createMockRow({ adminId: "admin-1", totalAmount: 200, count: 10 }),
      createMockRow({ adminId: "admin-2", totalAmount: 50, count: 2 }),
    ];
    const result = mapToMostActiveAdminStats(rows);
    expect(result).toEqual([
      { adminId: "admin-1", _sum: { amount: 200 }, _count: { id: 10 } },
      { adminId: "admin-2", _sum: { amount: 50 }, _count: { id: 2 } },
    ]);
  });

  it("returns an empty array for empty input", () => {
    const result = mapToMostActiveAdminStats([]);
    expect(result).toEqual([]);
  });

  it("maps rows with zero amounts and counts", () => {
    const rows = [createMockRow({ totalAmount: 0, count: 0 })];
    const result = mapToMostActiveAdminStats(rows);
    expect(result).toEqual([
      { adminId: "admin-123", _sum: { amount: 0 }, _count: { id: 0 } },
    ]);
  });
});

describe("buildAdditionalInsights", () => {
  it("builds insights with transactions and an active admin", () => {
    const transactions = [
      createMockTransaction(),
      createMockTransaction({ id: "tx-456", amount: 30, reason: "Reward" }),
    ];
    const result = buildAdditionalInsights(transactions, "Admin One", 15);
    expect(result).toEqual({
      mostActiveAdmin: {
        name: "Admin One",
        transactionCount: 15,
      },
      recentTransactions: transactions,
    });
  });

  it("builds insights with empty transactions", () => {
    const result = buildAdditionalInsights([], "Admin Two", 0);
    expect(result).toEqual({
      mostActiveAdmin: {
        name: "Admin Two",
        transactionCount: 0,
      },
      recentTransactions: [],
    });
  });

  it("builds insights with null transaction reason and group", () => {
    const transactions = [
      createMockTransaction({ reason: null, group: null }),
    ];
    const result = buildAdditionalInsights(transactions, "Admin Three", 3);
    expect(result).toEqual({
      mostActiveAdmin: {
        name: "Admin Three",
        transactionCount: 3,
      },
      recentTransactions: transactions,
    });
  });

  it("builds insights with a single transaction", () => {
    const transactions = [createMockTransaction({ id: "tx-789", amount: 10 })];
    const result = buildAdditionalInsights(transactions, "Admin Four", 1);
    expect(result).toEqual({
      mostActiveAdmin: {
        name: "Admin Four",
        transactionCount: 1,
      },
      recentTransactions: transactions,
    });
  });
});
