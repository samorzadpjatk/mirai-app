import type {
  ActivityFeed,
  ActivityReaction,
  ActivityId,
} from "@mirai-app/domain";
import type { ActivityFeedRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Activity Feed Repository for Testing
 *
 * Implements ActivityFeedRepository port with in-memory storage.
 * Stores activities and their reactions separately for efficient querying.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryActivityFeedRepository();
 * repo.seed([mockActivity]);
 *
 * const activities = await Effect.runPromise(repo.findByTripId("trip-123", { limit: 10 }));
 * expect(activities.activities).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryActivityFeedRepository
  extends InMemoryRepository<ActivityFeed>
  implements ActivityFeedRepository
{
  private reactionsStorage = new Map<string, ActivityReaction[]>();

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.reactionsStorage.clear();
    });
  }

  override seed(activities: ActivityFeed[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      activities.forEach((item) => this.storage.set(item.id, item));
    });
  }

  seedReactions(activityId: ActivityId, reactions: ActivityReaction[]): void {
    this.reactionsStorage.set(activityId, reactions);
  }

  findById(id: ActivityId): Effect.Effect<ActivityFeed | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Effect.Effect<
    {
      items: ActivityFeed[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    never,
    never
  > {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    let activities = this.getAllItems().filter(
      (a) => a.tripId === tripId && !a.isHidden,
    );

    activities.sort((a, b) => a.compareForSort(b));

    const total = activities.length;
    const paginatedActivities = activities.slice(offset, offset + limit);
    const hasMore = offset + paginatedActivities.length < total;

    return Effect.succeed({
      items: paginatedActivities,
      total,
      limit,
      offset,
      hasMore,
    });
  }

  findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    {
      activities: ActivityFeed[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasMore: boolean;
    },
    never,
    never
  > {
    const page = options.page;
    const pageSize = options.pageSize;
    const includeHidden = options.includeHidden ?? false;

    const allActivities = this.getAllItems().filter(
      (a) => a.tripId === tripId && (includeHidden || !a.isHidden),
    );

    allActivities.sort((a, b) => a.compareForSort(b));

    const total = allActivities.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const activities = allActivities.slice(offset, offset + pageSize);
    const hasMore = page < totalPages;

    return Effect.succeed({
      activities,
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
    });
  }

  create(activity: ActivityFeed): Effect.Effect<ActivityFeed, never, never> {
    return Effect.sync(() => {
      this.storage.set(activity.id, activity);
      return activity;
    });
  }

  update(activity: ActivityFeed): Effect.Effect<ActivityFeed, never, never> {
    return Effect.sync(() => {
      this.storage.set(activity.id, activity);
      return activity;
    });
  }

  delete(id: ActivityId): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.reactionsStorage.delete(id);
      this.storage.delete(id);
    });
  }

  exists(id: ActivityId): Effect.Effect<boolean, never, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  findReactionsByActivityId(
    activityId: ActivityId,
  ): Effect.Effect<ActivityReaction[], never, never> {
    return Effect.succeed(this.reactionsStorage.get(activityId) ?? []);
  }

  findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Effect.Effect<ActivityReaction[], never, never> {
    const reactions = this.reactionsStorage.get(activityId) ?? [];
    return Effect.succeed(reactions.filter((r) => r.userId === userId));
  }

  addReaction(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, never, never> {
    const activityId = reaction.activityId;
    const existingReactions = this.reactionsStorage.get(activityId) ?? [];

    const duplicateIndex = existingReactions.findIndex(
      (r) =>
        r.userId === reaction.userId &&
        r.reactionType === reaction.reactionType,
    );

    if (duplicateIndex !== -1) {
      existingReactions[duplicateIndex] = reaction;
    } else {
      existingReactions.push(reaction);
    }

    this.reactionsStorage.set(activityId, existingReactions);
    return Effect.succeed(reaction);
  }

  removeReaction(
    activityId: ActivityId,
    userId: string,
    reactionType: string,
  ): Effect.Effect<void, never, never> {
    const reactions = this.reactionsStorage.get(activityId) ?? [];
    const filteredReactions = reactions.filter(
      (r) => !(r.userId === userId && r.reactionType === reactionType),
    );
    this.reactionsStorage.set(activityId, filteredReactions);
    return Effect.succeed(undefined);
  }

  getReactionCounts(activityId: ActivityId): Effect.Effect<
    {
      total: number;
      counts: { heart: number; fire: number; clap: number; star: number };
    },
    never,
    never
  > {
    const reactions = this.reactionsStorage.get(activityId) ?? [];

    const counts = {
      heart: 0,
      fire: 0,
      clap: 0,
      star: 0,
    };

    for (const reaction of reactions) {
      if (reaction.reactionType in counts) {
        counts[reaction.reactionType as keyof typeof counts]++;
      }
    }

    return Effect.succeed({
      total: reactions.length,
      counts,
    });
  }
}
