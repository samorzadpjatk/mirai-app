import type {
  ActivityFeed,
  ActivityReaction,
  ActivityId,
} from "@mirai-app/domain";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
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
 * const activities = await repo.findByTripId("trip-123", { limit: 10 });
 * expect(activities.activities).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryActivityFeedRepository
  extends InMemoryRepository<ActivityFeed>
  implements ActivityFeedRepository
{
  /** Separate storage for reactions keyed by activity ID */
  private reactionsStorage = new Map<string, ActivityReaction[]>();

  /**
   * Reset the repository - clears all stored activities and reactions.
   * Call this in beforeEach for test isolation.
   */
  override reset(): void {
    super.reset();
    this.reactionsStorage.clear();
  }

  /**
   * Seed the repository with initial activities and optionally their reactions.
   * Useful for setting up test scenarios.
   *
   * @param activities - Array of ActivityFeed items to seed
   * @param reactions - Optional map of activity ID to reactions array
   */
  override seed(activities: ActivityFeed[]): void {
    super.seed(activities);
  }

  /**
   * Seed reactions for a specific activity.
   *
   * @param activityId - The activity ID
   * @param reactions - Array of reactions to associate with the activity
   */
  seedReactions(activityId: ActivityId, reactions: ActivityReaction[]): void {
    this.reactionsStorage.set(activityId, reactions);
  }

  async findById(id: ActivityId): Promise<ActivityFeed | null> {
    return this.findByIdGeneric(id);
  }

  async findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
    hasMore: boolean;
  }> {
    const limit = options?.limit ?? 20;
    const cursor = options?.cursor ?? null;
    const includeHidden = options?.includeHidden ?? false;

    // Filter by tripId and visibility
    let activities = this.getAllItems().filter(
      (a) => a.tripId === tripId && (includeHidden || !a.isHidden),
    );

    // Sort: pinned first, then by createdAt descending, then by id descending
    activities.sort((a, b) => a.compareForSort(b));

    // Apply cursor-based pagination
    if (cursor) {
      const cursorIndex = activities.findIndex(
        (a) =>
          a.id === cursor.id &&
          a.createdAt.getTime() === cursor.createdAt.getTime() &&
          a.isPinned === cursor.isPinned,
      );
      if (cursorIndex !== -1) {
        activities = activities.slice(cursorIndex + 1);
      }
    }

    // Apply limit
    const hasMore = activities.length > limit;
    const paginatedActivities = activities.slice(0, limit);

    // Calculate next cursor
    const lastActivity = paginatedActivities[paginatedActivities.length - 1];
    const nextCursor = lastActivity
      ? {
          id: lastActivity.id,
          createdAt: lastActivity.createdAt,
          isPinned: lastActivity.isPinned,
        }
      : null;

    return {
      activities: paginatedActivities,
      nextCursor,
      hasMore,
    };
  }

  async findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const page = options.page;
    const pageSize = options.pageSize;
    const includeHidden = options.includeHidden ?? false;

    // Filter by tripId and visibility
    const allActivities = this.getAllItems().filter(
      (a) => a.tripId === tripId && (includeHidden || !a.isHidden),
    );

    // Sort: pinned first, then by createdAt descending
    allActivities.sort((a, b) => a.compareForSort(b));

    const total = allActivities.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const activities = allActivities.slice(offset, offset + pageSize);
    const hasMore = page < totalPages;

    return {
      activities,
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
    };
  }

  async create(activity: ActivityFeed): Promise<ActivityFeed> {
    return this.createGeneric(activity);
  }

  async update(activity: ActivityFeed): Promise<ActivityFeed> {
    return this.updateGeneric(activity);
  }

  async delete(id: ActivityId): Promise<void> {
    await this.deleteGeneric(id);
    // Also clean up associated reactions
    this.reactionsStorage.delete(id);
  }

  async exists(id: ActivityId): Promise<boolean> {
    return this.existsGeneric(id);
  }

  async findReactionsByActivityId(
    activityId: ActivityId,
  ): Promise<ActivityReaction[]> {
    return this.reactionsStorage.get(activityId) ?? [];
  }

  async findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Promise<ActivityReaction[]> {
    const reactions = this.reactionsStorage.get(activityId) ?? [];
    return reactions.filter((r) => r.userId === userId);
  }

  async addReaction(reaction: ActivityReaction): Promise<ActivityReaction> {
    const activityId = reaction.activityId;
    const existingReactions = this.reactionsStorage.get(activityId) ?? [];

    // Check for duplicate (same user, same type)
    const duplicateIndex = existingReactions.findIndex(
      (r) =>
        r.userId === reaction.userId &&
        r.reactionType === reaction.reactionType,
    );

    if (duplicateIndex !== -1) {
      // Replace existing reaction with same type
      existingReactions[duplicateIndex] = reaction;
    } else {
      existingReactions.push(reaction);
    }

    this.reactionsStorage.set(activityId, existingReactions);
    return reaction;
  }

  async removeReaction(
    activityId: ActivityId,
    userId: string,
    reactionType: string,
  ): Promise<void> {
    const reactions = this.reactionsStorage.get(activityId) ?? [];
    const filteredReactions = reactions.filter(
      (r) => !(r.userId === userId && r.reactionType === reactionType),
    );
    this.reactionsStorage.set(activityId, filteredReactions);
  }

  async getReactionCounts(activityId: ActivityId): Promise<{
    total: number;
    counts: { heart: number; fire: number; clap: number; star: number };
  }> {
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

    return {
      total: reactions.length,
      counts,
    };
  }
}
