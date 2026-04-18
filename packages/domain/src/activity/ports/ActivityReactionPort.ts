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
 * Defines repository operations for activity reactions
 */
export interface IActivityReactionPort {
  findById(
    id: ActivityReactionId,
  ): Effect.Effect<ActivityReaction | null, IPortError, never>;
  findByActivityId(
    activityId: ActivityFeedId,
  ): Effect.Effect<ActivityReaction[], IPortError, never>;
  findByActivityIdAndUserId(
    activityId: ActivityFeedId,
    userId: UserId,
  ): Effect.Effect<ActivityReaction | null, IPortError, never>;
  create(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, IPortError, never>;
  delete(id: ActivityReactionId): Effect.Effect<void, IPortError, never>;
  deleteByActivityAndUser(
    activityId: ActivityFeedId,
    userId: UserId,
  ): Effect.Effect<void, IPortError, never>;
  countByActivityId(
    activityId: ActivityFeedId,
  ): Effect.Effect<number, IPortError, never>;
  countByActivityIdAndType(
    activityId: ActivityFeedId,
    reactionType: ActivityReactionType,
  ): Effect.Effect<number, IPortError, never>;
}
