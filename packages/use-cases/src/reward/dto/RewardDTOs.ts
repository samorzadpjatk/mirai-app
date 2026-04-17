import type {
  GroupId,
  RewardId,
  RewardPurchaseId,
  TripId,
  UserId,
} from "@mirai-app/domain";

export type RewardPurchaseStatus =
  | "BOUGHT"
  | "ACCEPTED"
  | "IN_DELIVERY"
  | "CANCELLED"
  | "DELIVERED";

/**
 * DTO for reward
 */
export interface RewardDTO {
  id: RewardId;
  name: string;
  description: string;
  availableQuantity: number;
  isHidden: boolean;
  image: string | null;
  coinCost: number;
  tripId: TripId;
  createdById: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for reward with availability
 */
export interface RewardWithAvailabilityDTO extends RewardDTO {
  remainingQuantity: number;
  isAvailable: boolean;
}

/**
 * DTO for reward with creator info
 */
export interface RewardWithCreatorDTO extends RewardDTO {
  creator: {
    id: UserId;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * DTO for paginated rewards
 */
export interface PaginatedRewardsDTO {
  rewards: RewardDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for reward purchase
 */
export interface RewardPurchaseDTO {
  id: RewardPurchaseId;
  rewardId: RewardId;
  groupId: GroupId;
  userId: UserId;
  quantity: number;
  totalCost: number;
  status: RewardPurchaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for reward purchase with details
 */
export interface RewardPurchaseWithDetailsDTO extends RewardPurchaseDTO {
  reward: RewardDTO | null;
  group: {
    id: GroupId;
    name: string;
    image: string | null;
  } | null;
  user: {
    id: UserId;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * DTO for paginated purchases
 */
export interface PaginatedPurchasesDTO {
  purchases: RewardPurchaseDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for reward creation result
 */
export interface CreateRewardResultDTO {
  id: RewardId;
  name: string;
  coinCost: number;
  tripId: TripId;
  createdAt: Date;
}

/**
 * DTO for reward update result
 */
export interface UpdateRewardResultDTO {
  id: RewardId;
  name: string;
  description: string;
  availableQuantity: number;
  coinCost: number;
  updatedAt: Date;
}

/**
 * DTO for purchase result
 */
export interface PurchaseRewardResultDTO {
  id: RewardPurchaseId;
  rewardId: RewardId;
  groupId: GroupId;
  userId: UserId;
  quantity: number;
  totalCost: number;
  status: RewardPurchaseStatus;
  remainingGroupCoins: number;
}

/**
 * DTO for purchase status change
 */
export interface PurchaseStatusChangeDTO {
  id: RewardPurchaseId;
  previousStatus: RewardPurchaseStatus;
  newStatus: RewardPurchaseStatus;
  changedAt: Date;
}
