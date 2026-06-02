export function calculateRewardProgress({
  reward,
  totalAvailablePoints,
  groupCoins,
  isGroupLeader,
  purchasedCount,
  isAllTrips,
}: {
  reward: { id: string; coinCost: number; availableQuantity: number };
  totalAvailablePoints: number;
  groupCoins: number;
  isGroupLeader: boolean;
  purchasedCount: number;
  isAllTrips: boolean;
}) {
  const originalCoinCost = reward.coinCost;
  let coinCost: number;

  if (isAllTrips || totalAvailablePoints === 0) {
    coinCost = originalCoinCost;
  } else {
    coinCost = Math.max(1, Math.floor(totalAvailablePoints * originalCoinCost / 100));
  }

  const canAfford = groupCoins >= coinCost;
  const isEligibleToBuy = isGroupLeader && canAfford;
  const isOutOfStock = reward.availableQuantity <= 0;

  return {
    coinCost,
    originalCoinCost,
    canAfford,
    isEligibleToBuy,
    isOutOfStock,
    purchasedCount,
  };
}
