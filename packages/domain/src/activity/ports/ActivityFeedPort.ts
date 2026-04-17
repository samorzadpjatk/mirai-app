import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { ActivityFeed } from "../entities/ActivityFeed";
import type { ActivityFeedId } from "../value-objects/ActivityId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Activity Feed Repository Port
 *
 * Defines the interface for activity feed persistence operations.
 */
export interface IActivityFeedPort {
  /**
   * Find activity by ID
   */
  findById(
    id: ActivityFeedId,
  ): Effect.Effect<ActivityFeed | null, IPortError, never>;

  /**
   * Find activities by trip
   */
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, never>;

  /**
   * Find visible activities by trip
   */
  findVisibleByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, never>;

  /**
   * Find pinned activities by trip
   */
  findPinnedByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, never>;

  /**
   * Find paginated activities by trip
   */
  findByTripIdPaginated(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Find activities for moderation
   */
  findByTripIdForModeration(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Create new activity
   */
  create(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, IPortError, never>;

  /**
   * Update existing activity
   */
  update(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, IPortError, never>;

  /**
   * Delete activity by ID
   */
  delete(id: ActivityFeedId): Effect.Effect<void, IPortError, never>;

  /**
   * Set activity pinned status
   */
  setPinned(
    id: ActivityFeedId,
    isPinned: boolean,
  ): Effect.Effect<ActivityFeed, IPortError, never>;

  /**
   * Check if activity exists
   */
  exists(id: ActivityFeedId): Effect.Effect<boolean, IPortError, never>;
}
