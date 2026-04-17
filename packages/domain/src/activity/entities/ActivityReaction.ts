import type { ActivityFeedId } from "../value-objects/ActivityId";
import type { ActivityReactionId } from "../value-objects/ActivityId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Activity reaction type
 * Duplicated here to avoid circular imports - use ActivityReactionType from ports for imports
 */
type ActivityReactionType = "heart" | "fire" | "clap" | "star";

/**
 * ActivityReaction entity interface
 * Represents a user's reaction to an activity feed item
 */
export interface ActivityReaction {
  id: ActivityReactionId;
  activityId: ActivityFeedId;
  userId: UserId;
  reactionType: ActivityReactionType;
  createdAt: Date;
}
