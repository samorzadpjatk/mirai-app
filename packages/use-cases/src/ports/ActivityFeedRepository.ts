import type {
  ActivityFeed,
  ActivityReaction,
  ActivityId,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * ActivityFeedRepository Port
 *
 * This interface defines what operations the application needs
 * from any activity feed repository implementation.
 *
 * Implementations (in adapters layer):
 * - PrismaActivityFeedRepository: Uses Prisma ORM
 * - InMemoryActivityFeedRepository: For testing
 */
export interface ActivityFeedRepository {
  /**
   * Find activity by ID
   * @returns ActivityFeed or null if not found
   */
  findById(id: ActivityId): Effect.Effect<ActivityFeed | null, never, never>;

  /**
   * Find activities by trip ID with pagination
   * @param tripId - The trip ID to filter by
   * @param options - Pagination and filtering options
   */
  findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    {
      activities: ActivityFeed[];
      nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
      hasMore: boolean;
    },
    never,
    never
  >;

  /**
   * Get activities with offset pagination (legacy support)
   * @param tripId - The trip ID to filter by
   * @param options - Page-based pagination options
   */
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
  >;

  /**
   * Create a new activity
   */
  create(activity: ActivityFeed): Effect.Effect<ActivityFeed, never, never>;

  /**
   * Update an activity
   */
  update(activity: ActivityFeed): Effect.Effect<ActivityFeed, never, never>;

  /**
   * Delete an activity
   */
  delete(id: ActivityId): Effect.Effect<void, never, never>;

  /**
   * Check if activity exists
   */
  exists(id: ActivityId): Effect.Effect<boolean, never, never>;

  /**
   * Find reactions for an activity
   */
  findReactionsByActivityId(
    activityId: ActivityId,
  ): Effect.Effect<ActivityReaction[], never, never>;

  /**
   * Find user's reactions for an activity
   */
  findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Effect.Effect<ActivityReaction[], never, never>;

  /**
   * Add a reaction to an activity
   */
  addReaction(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, never, never>;

  /**
   * Remove a reaction from an activity
   */
  removeReaction(
    activityId: ActivityId,
    userId: string,
    reactionType: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Get reaction counts for an activity
   */
  getReactionCounts(activityId: ActivityId): Effect.Effect<
    {
      total: number;
      counts: { heart: number; fire: number; clap: number; star: number };
    },
    never,
    never
  >;
}

/**
 * ActivityFeedRepository Context.Tag for Effect dependency injection
 */
export class ActivityFeedRepositoryTag extends Context.Tag(
  "ActivityFeedRepository",
)<
  ActivityFeedRepositoryTag,
  {
    findById: (
      id: ActivityId,
    ) => Effect.Effect<ActivityFeed | null, never, never>;
    findByTripId: (
      tripId: string,
      options?: {
        limit?: number;
        cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
        includeHidden?: boolean;
      },
    ) => Effect.Effect<
      {
        activities: ActivityFeed[];
        nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
        hasMore: boolean;
      },
      never,
      never
    >;
    findByTripIdPaged: (
      tripId: string,
      options: {
        page: number;
        pageSize: number;
        includeHidden?: boolean;
      },
    ) => Effect.Effect<
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
    >;
    create: (
      activity: ActivityFeed,
    ) => Effect.Effect<ActivityFeed, never, never>;
    update: (
      activity: ActivityFeed,
    ) => Effect.Effect<ActivityFeed, never, never>;
    delete: (id: ActivityId) => Effect.Effect<void, never, never>;
    exists: (id: ActivityId) => Effect.Effect<boolean, never, never>;
    findReactionsByActivityId: (
      activityId: ActivityId,
    ) => Effect.Effect<ActivityReaction[], never, never>;
    findUserReactions: (
      activityId: ActivityId,
      userId: string,
    ) => Effect.Effect<ActivityReaction[], never, never>;
    addReaction: (
      reaction: ActivityReaction,
    ) => Effect.Effect<ActivityReaction, never, never>;
    removeReaction: (
      activityId: ActivityId,
      userId: string,
      reactionType: string,
    ) => Effect.Effect<void, never, never>;
    getReactionCounts: (activityId: ActivityId) => Effect.Effect<
      {
        total: number;
        counts: { heart: number; fire: number; clap: number; star: number };
      },
      never,
      never
    >;
  }
>() {}
