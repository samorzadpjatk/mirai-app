import { Context, Effect } from "effect";
import type { DatabaseError } from "@mirai-app/domain";
import type { ActivityReactionDTO } from "../dto/ActivityFeedDTOs";

/**
 * ActivityReaction Port - Repository interface with Context.Tag for Effect DI
 */
export interface IActivityReactionPort {
  findById(
    id: string,
  ): Effect.Effect<ActivityReaction | null, DatabaseError, never>;
  findByActivityId(
    activityId: string,
  ): Effect.Effect<ActivityReaction[], DatabaseError, never>;
  findByActivityIdAndUserId(
    activityId: string,
    userId: string,
  ): Effect.Effect<ActivityReaction | null, DatabaseError, never>;
  create(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  deleteByActivityAndUser(
    activityId: string,
    userId: string,
  ): Effect.Effect<void, DatabaseError, never>;
  countByActivityId(
    activityId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  countByActivityIdAndType(
    activityId: string,
    reactionType: ActivityReactionType,
  ): Effect.Effect<number, DatabaseError, never>;
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
