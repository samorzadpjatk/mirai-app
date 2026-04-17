import { Data } from "effect";

/**
 * Reward-related errors for use cases
 */

export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{
  rewardId: string;
}> {}

export class RewardPurchaseNotFoundError extends Data.TaggedError(
  "RewardPurchaseNotFoundError",
)<{
  purchaseId: string;
}> {}

export class RewardValidationError extends Data.TaggedError(
  "RewardValidationError",
)<{
  field: string;
  message: string;
}> {}

export class RewardAlreadyExistsError extends Data.TaggedError(
  "RewardAlreadyExistsError",
)<{
  rewardId: string;
}> {}

export class RewardHasPurchasesError extends Data.TaggedError(
  "RewardHasPurchasesError",
)<{
  rewardId: string;
  purchaseCount: number;
}> {}

export class RewardOutOfStockError extends Data.TaggedError(
  "RewardOutOfStockError",
)<{
  rewardId: string;
  requestedQuantity: number;
  availableQuantity: number;
}> {}

export class RewardHiddenError extends Data.TaggedError("RewardHiddenError")<{
  rewardId: string;
}> {}

export class InsufficientCoinsError extends Data.TaggedError(
  "InsufficientCoinsError",
)<{
  groupId: string;
  required: number;
  available: number;
}> {}

export class PurchaseStatusTransitionError extends Data.TaggedError(
  "PurchaseStatusTransitionError",
)<{
  purchaseId: string;
  fromStatus: string;
  toStatus: string;
}> {}

export class InvalidPurchaseStatusError extends Data.TaggedError(
  "InvalidPurchaseStatusError",
)<{
  purchaseId: string;
  status: string;
  reason: string;
}> {}

export class CollectionMethodRequiredError extends Data.TaggedError(
  "CollectionMethodRequiredError",
)<{
  purchaseId: string;
}> {}

export class NotGroupLeaderError extends Data.TaggedError(
  "NotGroupLeaderError",
)<{
  userId: string;
  groupId: string;
}> {}

export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}> {}

export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}

export class TripEndedError extends Data.TaggedError("TripEndedError")<{
  tripId: string;
  endedAt: Date;
}> {}

export class UnauthorizedRewardActionError extends Data.TaggedError(
  "UnauthorizedRewardActionError",
)<{
  userId: string;
  action: string;
  rewardId: string;
}> {}

export class GroupNotInTripError extends Data.TaggedError(
  "GroupNotInTripError",
)<{
  groupId: string;
  tripId: string;
}> {}
