export type RewardPurchaseStatus = "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";

export const canTransitionPurchaseStatus = (from: RewardPurchaseStatus, to: RewardPurchaseStatus) => {
  if (from === to) return true;

  const transitions: Record<RewardPurchaseStatus, RewardPurchaseStatus[]> = {
    BOUGHT: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_DELIVERY", "CANCELLED"],
    IN_DELIVERY: ["DELIVERED", "CANCELLED"],
    CANCELLED: [],
    DELIVERED: [],
  };

  return transitions[from].includes(to);
};
