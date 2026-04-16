/**
 * Reward Enums
 *
 * Enums for rewards and purchases.
 *
 * @module enums/reward
 */

/**
 * Reward status
 * Represents the availability status of a reward
 */
export enum RewardStatus {
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  HIDDEN = "HIDDEN",
}

/**
 * Reward purchase status
 * State machine for reward purchase lifecycle
 */
export enum RewardPurchaseStatus {
  BOUGHT = "BOUGHT",
  ACCEPTED = "ACCEPTED",
  IN_DELIVERY = "IN_DELIVERY",
  CANCELLED = "CANCELLED",
  DELIVERED = "DELIVERED",
}

/**
 * All valid reward purchase statuses
 */
export const REWARD_PURCHASE_STATUSES: RewardPurchaseStatus[] = [
  RewardPurchaseStatus.BOUGHT,
  RewardPurchaseStatus.ACCEPTED,
  RewardPurchaseStatus.IN_DELIVERY,
  RewardPurchaseStatus.CANCELLED,
  RewardPurchaseStatus.DELIVERED,
];

/**
 * Purchase status transitions
 * Defines valid state transitions for the purchase state machine
 */
export const REWARD_PURCHASE_STATUS_TRANSITIONS: Record<
  RewardPurchaseStatus,
  RewardPurchaseStatus[]
> = {
  [RewardPurchaseStatus.BOUGHT]: [
    RewardPurchaseStatus.ACCEPTED,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.ACCEPTED]: [
    RewardPurchaseStatus.IN_DELIVERY,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.IN_DELIVERY]: [
    RewardPurchaseStatus.DELIVERED,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.CANCELLED]: [],
  [RewardPurchaseStatus.DELIVERED]: [],
};

/**
 * Type guard to check if a string is a valid RewardPurchaseStatus
 */
export function isRewardPurchaseStatus(
  value: string,
): value is RewardPurchaseStatus {
  return Object.values(RewardPurchaseStatus).includes(
    value as RewardPurchaseStatus,
  );
}

/**
 * Check if a purchase status is terminal
 */
export function isTerminalPurchaseStatus(
  status: RewardPurchaseStatus,
): boolean {
  return (
    status === RewardPurchaseStatus.CANCELLED ||
    status === RewardPurchaseStatus.DELIVERED
  );
}

/**
 * Check if a purchase status is in progress
 */
export function isInProgressPurchaseStatus(
  status: RewardPurchaseStatus,
): boolean {
  return (
    status === RewardPurchaseStatus.ACCEPTED ||
    status === RewardPurchaseStatus.IN_DELIVERY
  );
}

/**
 * Alias for RewardPurchaseStatus for use in DTOs
 */
export type PurchaseStatus = RewardPurchaseStatus;
