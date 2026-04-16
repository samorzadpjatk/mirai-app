import type { ActivityId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
  ActivityPaginatedResult,
  ActivityPagedResult,
  ActivityCursorResult,
} from "../dto";

/**
 * ActivityFeedGateway Port
 *
 * This interface defines what operations the application needs
 * from any activity feed gateway implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleActivityFeedGateway: Uses Drizzle ORM
 * - InMemoryActivityFeedGateway: For testing
 *
 * All methods return DTOs instead of domain entities.
 */
export interface ActivityFeedGateway {
  /**
   * Find activity by ID
   * @returns ActivityFeedDTO or null if not found
   */
  findById(id: ActivityId): Effect.Effect<ActivityFeedDTO | null, never, never>;

  /**
   * Find activities by trip ID with cursor-based pagination
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
  ): Effect.Effect<ActivityCursorResult, never, never>;

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
  ): Effect.Effect<ActivityPagedResult, never, never>;

  /**
   * Create a new activity
   */
  create(
    activity: ActivityFeedDTO,
  ): Effect.Effect<ActivityFeedDTO, never, never>;

  /**
   * Update an activity
   */
  update(
    activity: ActivityFeedDTO,
  ): Effect.Effect<ActivityFeedDTO, never, never>;

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
  ): Effect.Effect<ActivityReactionDTO[], never, never>;

  /**
   * Find user's reactions for an activity
   */
  findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Effect.Effect<ActivityReactionDTO[], never, never>;

  /**
   * Add a reaction to an activity
   */
  addReaction(
    reaction: ActivityReactionDTO,
  ): Effect.Effect<ActivityReactionDTO, never, never>;

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
 * ActivityFeedGateway Context.Tag for Effect dependency injection
 */
export class ActivityFeedGatewayTag extends Context.Tag("ActivityFeedGateway")<
  ActivityFeedGatewayTag,
  ActivityFeedGateway
>() {}
