import { Context, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import type { ActivityReactionDTO } from "../dto/ActivityFeedDTOs";

/**
 * ActivityReaction Port - Repository interface with Context.Tag for Effect DI
 */
export interface IActivityReactionPort {
  findById(
    id: string,
  ): Effect.Effect<ActivityReaction | null, IPortError, never>;
  findByActivityId(
    activityId: string,
  ): Effect.Effect<ActivityReaction[], IPortError, never>;
  findByActivityIdAndUserId(
    activityId: string,
    userId: string,
  ): Effect.Effect<ActivityReaction | null, IPortError, never>;
  create(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  deleteByActivityAndUser(
    activityId: string,
    userId: string,
  ): Effect.Effect<void, IPortError, never>;
  countByActivityId(
    activityId: string,
  ): Effect.Effect<number, IPortError, never>;
  countByActivityIdAndType(
    activityId: string,
    reactionType: ActivityReactionType,
  ): Effect.Effect<number, IPortError, never>;
}

export class ActivityReactionPortTag extends Context.Tag(
  "ActivityReactionPort",
)<ActivityReactionPortTag, IActivityReactionPort>() {}

/**
 * Activity reaction type
 */
export type ActivityReactionType = "heart" | "fire" | "clap" | "star";

/**
 * ActivityReaction entity interface for use cases
 */
export interface ActivityReaction {
  id: string;
  activityId: string;
  userId: string;
  reactionType: ActivityReactionType;
  createdAt: Date;
}
