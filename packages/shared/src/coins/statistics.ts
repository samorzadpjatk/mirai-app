export interface CoinStatistics {
  transactionCount: number;
  addedCoins: number;
  removedCoins: number;
  netBalance: number;
}

/**
 * Builds coin statistics from raw DB aggregates.
 * Pure: no side effects, no async, no DB calls.
 */
export function buildCoinStatistics(
  transactionCount: number,
  addedCoins: number,
  removedCoins: number,
): CoinStatistics {
  return {
    transactionCount,
    addedCoins,
    removedCoins,
    netBalance: addedCoins + removedCoins,
  };
}

export interface QuickStats {
  totalCoins: number;
  totalGroups: number;
  averageCoinsPerGroup: number;
  richestGroupName: string;
}

/**
 * Calculates quick stats from total amount, transaction count, and richest group name.
 * Pure: no side effects, no async, no DB calls.
 */
export function calculateQuickStats(
  totalAmount: number,
  count: number,
  richestGroupName: string,
): QuickStats {
  return {
    totalCoins: totalAmount,
    totalGroups: count,
    averageCoinsPerGroup: count ? Math.round(totalAmount / count) : 0,
    richestGroupName,
  };
}
