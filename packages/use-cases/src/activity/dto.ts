/**
 * Activity DTOs
 *
 * Data Transfer Objects for Activity domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type {
  PaginatedResult,
  PagedResult,
  CursorPaginatedResult,
} from "../system/shared/dto";

/**
 * ActivityFeedDTO - Lightweight representation of activity feed item
 */
export interface ActivityFeedDTO {
  id: string;
  tripId: string;
  userId: string;
  activityType: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isHidden: boolean;
  hiddenByAdmin?: string | null;
  hiddenAt?: Date | null;
  hiddenReason?: string | null;
  metadata?: Record<string, unknown>;
  reactions?: ActivityReactionDTO[];
  reactionCounts?: {
    total: number;
    counts: { heart: number; fire: number; clap: number; star: number };
  };
}

/**
 * ActivityReactionDTO - Representation of an activity reaction
 */
export interface ActivityReactionDTO {
  id: string;
  activityId: string;
  userId: string;
  reactionType: string;
  createdAt: Date;
}

/**
 * Paginated result for activity queries (offset-based)
 */
export type ActivityPaginatedResult = PaginatedResult<ActivityFeedDTO>;

/**
 * Paged result for legacy pagination (page-based)
 */
export type ActivityPagedResult = PagedResult<ActivityFeedDTO>;

/**
 * Cursor-based paginated result for activity queries
 */
export type ActivityCursorResult = CursorPaginatedResult<
  ActivityFeedDTO,
  { id: string; createdAt: Date; isPinned: boolean }
>;
