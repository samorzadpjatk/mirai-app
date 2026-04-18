import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { ActivityFeed } from "../entities/ActivityFeed";
import type { ActivityFeedId } from "../value-objects/ActivityId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Activity Feed Repository Port
 *
 * Defines the interface for activity feed persistence operations.
 *
 * Authorization Pattern:
 * This port uses the AuthContext pattern for authorization. All methods
 * access authentication context via `yield* AuthContextTag` and perform strict
 * authorization checks via `yield* AuthZPortTag.verifyAccess()` before executing
 * database operations.
 *
 * AuthContextTag provides userId, role, and tripRoles.
 * AuthZPortTag provides verifyAccess() for permission checks.
 *
 * ActivityFeed is trip-scoped - users can only see posts from trips they're members of.
 * ORGANIZER+ can create posts.
 */
export interface IActivityFeedPort {
  /**
   * Find activity by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. ActivityFeed is trip-scoped - users can only
   * access activities from trips they're members of.
   */
  findById(
    id: ActivityFeedId,
  ): Effect.Effect<ActivityFeed | null, IPortError, unknown>;

  /**
   * Find activities by trip
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Users can only see posts from trips they're members of.
   */
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, unknown>;

  /**
   * Find visible activities by trip
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context.
   */
  findVisibleByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, unknown>;

  /**
   * Find pinned activities by trip
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context.
   */
  findPinnedByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], IPortError, unknown>;

  /**
   * Find paginated activities by trip
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context.
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
    unknown
  >;

  /**
   * Find activities for moderation
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Requires admin permission.
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
    unknown
  >;

  /**
   * Create new activity
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. ORGANIZER+ can create posts (requires "write" permission).
   */
  create(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, IPortError, unknown>;

  /**
   * Update existing activity
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Requires "write" permission.
   */
  update(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, IPortError, unknown>;

  /**
   * Delete activity by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Requires "admin" permission.
   */
  delete(id: ActivityFeedId): Effect.Effect<void, IPortError, unknown>;

  /**
   * Set activity pinned status
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Requires "admin" permission.
   */
  setPinned(
    id: ActivityFeedId,
    isPinned: boolean,
  ): Effect.Effect<ActivityFeed, IPortError, unknown>;

  /**
   * Check if activity exists
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context.
   */
  exists(id: ActivityFeedId): Effect.Effect<boolean, IPortError, unknown>;
}
