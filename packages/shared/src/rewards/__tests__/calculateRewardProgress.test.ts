import { describe, it, expect } from "vitest";
import { calculateRewardProgress } from "../calculateRewardProgress";

describe("calculateRewardProgress", () => {
  const baseReward = { id: "r1", coinCost: 50, availableQuantity: 5 };

  it("returns original coinCost when totalAvailablePoints is 0", () => {
    const result = calculateRewardProgress({
      reward: baseReward,
      totalAvailablePoints: 0,
      groupCoins: 100,
      isGroupLeader: true,
      purchasedCount: 2,
      isAllTrips: false,
    });
    expect(result.coinCost).toBe(50);
    expect(result.originalCoinCost).toBe(50);
    expect(result.canAfford).toBe(true);
    expect(result.isEligibleToBuy).toBe(true);
    expect(result.isOutOfStock).toBe(false);
    expect(result.purchasedCount).toBe(2);
  });

  it("calculates dynamic coinCost from totalAvailablePoints", () => {
    const result = calculateRewardProgress({
      reward: baseReward,
      totalAvailablePoints: 1000,
      groupCoins: 30,
      isGroupLeader: false,
      purchasedCount: 0,
      isAllTrips: false,
    });
    expect(result.coinCost).toBe(500);
    expect(result.originalCoinCost).toBe(50);
    expect(result.canAfford).toBe(false);
    expect(result.isEligibleToBuy).toBe(false);
  });

  it("enforces minimum coinCost of 1", () => {
    const result = calculateRewardProgress({
      reward: { id: "r2", coinCost: 1, availableQuantity: 1 },
      totalAvailablePoints: 100,
      groupCoins: 0,
      isGroupLeader: true,
      purchasedCount: 0,
      isAllTrips: false,
    });
    expect(result.coinCost).toBe(1);
  });

  it("skips dynamic pricing for all trips", () => {
    const result = calculateRewardProgress({
      reward: baseReward,
      totalAvailablePoints: 1000,
      groupCoins: 100,
      isGroupLeader: true,
      purchasedCount: 0,
      isAllTrips: true,
    });
    expect(result.coinCost).toBe(50);
  });

  it("marks out of stock when availableQuantity <= 0", () => {
    const result = calculateRewardProgress({
      reward: { id: "r3", coinCost: 10, availableQuantity: 0 },
      totalAvailablePoints: 0,
      groupCoins: 100,
      isGroupLeader: true,
      purchasedCount: 0,
      isAllTrips: false,
    });
    expect(result.isOutOfStock).toBe(true);
  });
});
