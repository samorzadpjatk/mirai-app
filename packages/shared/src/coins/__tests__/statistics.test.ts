import { describe, it, expect } from "vitest";
import { buildCoinStatistics, calculateQuickStats } from "../statistics";

describe("buildCoinStatistics", () => {
  it("builds statistics from positive transaction counts and amounts", () => {
    const result = buildCoinStatistics(10, 100, -30);
    expect(result).toEqual({
      transactionCount: 10,
      addedCoins: 100,
      removedCoins: -30,
      netBalance: 70,
    });
  });

  it("builds statistics with zero values", () => {
    const result = buildCoinStatistics(0, 0, 0);
    expect(result).toEqual({
      transactionCount: 0,
      addedCoins: 0,
      removedCoins: 0,
      netBalance: 0,
    });
  });

  it("builds statistics when removedCoins is positive (representing removal)", () => {
    const result = buildCoinStatistics(5, 50, 20);
    expect(result).toEqual({
      transactionCount: 5,
      addedCoins: 50,
      removedCoins: 20,
      netBalance: 70,
    });
  });

  it("builds statistics with large numbers", () => {
    const result = buildCoinStatistics(1000000, 999999999, -111111111);
    expect(result).toEqual({
      transactionCount: 1000000,
      addedCoins: 999999999,
      removedCoins: -111111111,
      netBalance: 888888888,
    });
  });

  it("builds statistics when addedCoins is negative", () => {
    const result = buildCoinStatistics(3, -10, 5);
    expect(result).toEqual({
      transactionCount: 3,
      addedCoins: -10,
      removedCoins: 5,
      netBalance: -5,
    });
  });
});

describe("calculateQuickStats", () => {
  it("calculates quick stats with normal values", () => {
    const result = calculateQuickStats(500, 10, "Alpha Group");
    expect(result).toEqual({
      totalCoins: 500,
      totalGroups: 10,
      averageCoinsPerGroup: 50,
      richestGroupName: "Alpha Group",
    });
  });

  it("returns zero average when count is zero", () => {
    const result = calculateQuickStats(0, 0, "None");
    expect(result).toEqual({
      totalCoins: 0,
      totalGroups: 0,
      averageCoinsPerGroup: 0,
      richestGroupName: "None",
    });
  });

  it("rounds average coins per group to nearest integer", () => {
    const result = calculateQuickStats(100, 3, "Beta Group");
    expect(result).toEqual({
      totalCoins: 100,
      totalGroups: 3,
      averageCoinsPerGroup: 33,
      richestGroupName: "Beta Group",
    });
  });

  it("calculates quick stats with a single group", () => {
    const result = calculateQuickStats(42, 1, "Solo Group");
    expect(result).toEqual({
      totalCoins: 42,
      totalGroups: 1,
      averageCoinsPerGroup: 42,
      richestGroupName: "Solo Group",
    });
  });

  it("handles large totals and counts", () => {
    const result = calculateQuickStats(1000000, 1000, "Mega Group");
    expect(result).toEqual({
      totalCoins: 1000000,
      totalGroups: 1000,
      averageCoinsPerGroup: 1000,
      richestGroupName: "Mega Group",
    });
  });
});
