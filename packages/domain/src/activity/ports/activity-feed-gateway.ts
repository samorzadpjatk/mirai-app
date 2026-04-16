import type { ActivityFeed } from "../entities/activity-feed";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * ActivityFeedGateway Port
 *
 * This interface defines what operations the application needs
 * from any activity feed gateway implementation.
 */
export interface ActivityFeedGateway {
  /**
   * Create a new activity feed entry
   */
  create(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;

  /**
   * Find activity by ID
   * @returns Activity or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<ActivityFeed | null, DatabaseError, never>;

  /**
   * Find activities by trip ID with pagination
   */
  findByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<ActivityFeed>, DatabaseError, never>;

  /**
   * Find activities by user ID
   */
  findByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<ActivityFeed>, DatabaseError, never>;

  /**
   * Find activities by group ID
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<ActivityFeed>, DatabaseError, never>;

  /**
   * Update activity
   */
  update(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;

  /**
   * Delete activity
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Soft delete activity (mark as deleted)
   */
  softDelete(
    id: string,
    deletedById: string,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;

  /**
   * Restore soft-deleted activity
   */
  restore(id: string): Effect.Effect<ActivityFeed, DatabaseError, never>;
}
