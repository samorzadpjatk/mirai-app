/**
 * Reward DTOs
 *
 * Data Transfer Objects for Reward domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type { RewardStatus, PurchaseStatus } from "@mirai-app/domain";

/**
 * RewardDTO - Lightweight representation of a reward
 */
export interface RewardDTO {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  images?: string[]; // Array of image URLs
  pointsCost: number;
  quantity: number | null;
  availableQuantity: number;
  status: RewardStatus;
  isHidden: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RewardPurchaseDTO - Representation of a reward purchase
 */
export interface RewardPurchaseDTO {
  id: string;
  rewardId: string;
  groupId: string;
  userId: string;
  pointsSpent: number;
  totalCost: number;
  status: PurchaseStatus;
  quantity: number;
  collectionMethod: string | null;
  collectedAt: Date | null;
  collectedById: string | null;
  notes: string | null;
  purchasedAt: Date;
  updatedAt: Date;
  statusUpdatedAt: Date;
  statusUpdatedById: string | null;
}

/**
 * Paginated result for reward queries
 */
export type RewardPaginatedResult = PaginatedResult<RewardDTO>;

/**
 * Paginated result for purchase queries
 */
export type PurchasePaginatedResult = PaginatedResult<RewardPurchaseDTO>;
