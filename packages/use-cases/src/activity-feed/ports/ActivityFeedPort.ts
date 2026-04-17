import { Context, Effect } from "effect";
import type { DatabaseError, ActivityFeedId, TripId } from "@mirai-app/domain";

/**
 * ActivityFeed Port - Repository interface with Context.Tag for Effect DI
 */
export interface IActivityFeedPort {
  findById(
    id: ActivityFeedId,
  ): Effect.Effect<ActivityFeed | null, DatabaseError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], DatabaseError, never>;
  findByTripIdPaginated(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    DatabaseError,
    never
  >;
  findByTripIdForModeration(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;
  update(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;
  delete(id: ActivityFeedId): Effect.Effect<void, DatabaseError, never>;
  setPinned(
    id: ActivityFeedId,
    isPinned: boolean,
  ): Effect.Effect<ActivityFeed, DatabaseError, never>;
  exists(id: ActivityFeedId): Effect.Effect<boolean, DatabaseError, never>;
}

export class ActivityFeedPortTag extends Context.Tag("ActivityFeedPort")<
  ActivityFeedPortTag,
  IActivityFeedPort
>() {}

/**
 * ActivityFeed entity interface for use cases
 */
export interface ActivityFeed {
  id: string;
  tripId: string;
  activityType: "SUBMISSION" | "CHALLENGE" | "RANK_CHANGE" | "USER_POST";
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  hiddenByAdmin: string | null;
  hiddenAt: Date | null;
  hiddenReason: string | null;
  createdByAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
}
