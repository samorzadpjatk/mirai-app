import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { UserId } from "../../user/value-objects/UserId";
import type { ActivityFeedId } from "../value-objects/ActivityId";
import type { ActivityReactionId } from "../value-objects/ActivityId";
import type { ActivityReaction } from "../entities/ActivityReaction";

/**
 * Activity reaction type
 */
export type ActivityReactionType = "heart" | "fire" | "clap" | "star";

/**
 * ActivityReaction Port
 *
 * Defines repository operations for activity reactions.
 *
 * Authorization Pattern:
 * This port uses the AuthContext pattern for authorization. All methods
 * access authentication context via `yield* AuthContextTag` and perform strict
 * authorization checks via `yield* AuthZPortTag.verifyAccess()` before executing
 * database operations.
 *
 * Activity reactions are trip-scoped (via activityId -> activityFeed -> tripId):
 * - Users can only react to activities in trips they're members of
 * - Reactions are user-specific (users can only modify their own reactions)
 * - Uses "read" permission for all query operations
 * - Uses "write" permission for mutations (create, delete)
 */
export interface IActivityReactionPort {
  /**
   * Find reaction by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Verifies trip membership via activity's tripId.
   */
  findById(
    id: ActivityReactionId,
  ): Effect.Effect<ActivityReaction | null, IPortError, unknown>;

  /**
   * Find reactions by activity ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Verifies trip membership via activity's tripId.
   */
  findByActivityId(
    activityId: ActivityFeedId,
  ): Effect.Effect<ActivityReaction[], IPortError, unknown>;

  /**
   * Find reaction by activity ID and user ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Verifies trip membership via activity's tripId.
   */
  findByActivityIdAndUserId(
    activityId: ActivityFeedId,
    userId: UserId,
  ): Effect.Effect<ActivityReaction | null, IPortError, unknown>;

  /**
   * Create new reaction
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Users can only create reactions for themselves
   * in trips they're members of. Requires "write" permission.
   */
  create(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, IPortError, unknown>;

  /**
   * Delete reaction by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Users can only delete their own reactions (or admin).
   * Requires "write" permission.
   */
  delete(id: ActivityReactionId): Effect.Effect<void, IPortError, unknown>;

  /**
   * Delete reaction by activity and user
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Users can only delete their own reactions (or admin).
   * Requires "write" permission.
   */
  deleteByActivityAndUser(
    activityId: ActivityFeedId,
    userId: UserId,
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Count reactions by activity ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Verifies trip membership via activity's tripId.
   */
  countByActivityId(
    activityId: ActivityFeedId,
  ): Effect.Effect<number, IPortError, unknown>;

  /**
   * Count reactions by activity ID and type
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Verifies trip membership via activity's tripId.
   */
  countByActivityIdAndType(
    activityId: ActivityFeedId,
    reactionType: ActivityReactionType,
  ): Effect.Effect<number, IPortError, unknown>;
}
