import type { ActivityId } from "@mirai-app/domain";
import type { ActivityFeedGateway } from "@mirai-app/use-cases";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
  ActivityCursorResult,
  ActivityPagedResult,
} from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Activity Feed Gateway for Testing
 *
 * Implements ActivityFeedGateway port with in-memory storage.
 * Stores ActivityFeedDTOs and their reactions separately for efficient querying.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryActivityFeedGateway();
 * gateway.seed([mockActivityDTO]);
 *
 * const activities = await Effect.runPromise(gateway.findByTripId("trip-123", { limit: 10 }));
 * expect(activities.items).toHaveLength(1);
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryActivityFeedGateway
  extends InMemoryGateway<ActivityFeedDTO>
  implements ActivityFeedGateway
{
  private reactionsStorage = new Map<string, ActivityReactionDTO[]>();

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.reactionsStorage.clear();
    });
  }

  override seed(items: ActivityFeedDTO[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.storage.set(item.id, item));
    });
  }

  seedReactions(
    activityId: ActivityId,
    reactions: ActivityReactionDTO[],
  ): void {
    this.reactionsStorage.set(activityId, reactions);
  }

  findById(
    id: ActivityId,
  ): Effect.Effect<ActivityFeedDTO | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<ActivityCursorResult, never, never> {
    const limit = options?.limit ?? 20;
    const cursor = options?.cursor;
    const includeHidden = options?.includeHidden ?? false;

    let items = this.getAllItems().filter(
      (a) => a.tripId === tripId && (includeHidden || !a.isHidden),
    );

    // Sort by isPinned (desc), then createdAt (desc)
    items.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // If cursor provided, filter to items after the cursor
    if (cursor) {
      const cursorIndex = items.findIndex(
        (a) =>
          a.id === cursor.id &&
          a.createdAt.getTime() === cursor.createdAt.getTime() &&
          a.isPinned === cursor.isPinned,
      );
      if (cursorIndex !== -1) {
        items = items.slice(cursorIndex + 1);
      }
    }

    const paginatedItems = items.slice(0, limit);
    const hasMore = items.length > limit;

    // Determine next cursor from the last item
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? {
            id: lastItem.id,
            createdAt: lastItem.createdAt,
            isPinned: lastItem.isPinned,
          }
        : null;

    return Effect.succeed({
      items: paginatedItems,
      nextCursor,
      hasMore,
      total: items.length,
    });
  }

  findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Effect.Effect<ActivityPagedResult, never, never> {
    const page = options.page;
    const pageSize = options.pageSize;
    const includeHidden = options.includeHidden ?? false;

    const allItems = this.getAllItems().filter(
      (a) => a.tripId === tripId && (includeHidden || !a.isHidden),
    );

    // Sort by isPinned (desc), then createdAt (desc)
    allItems.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = allItems.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const items = allItems.slice(offset, offset + pageSize);
    const hasMore = page < totalPages;

    return Effect.succeed({
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
    });
  }

  create(dto: ActivityFeedDTO): Effect.Effect<ActivityFeedDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(dto.id, dto);
      return dto;
    });
  }

  update(dto: ActivityFeedDTO): Effect.Effect<ActivityFeedDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(dto.id, dto);
      return dto;
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
  ): Effect.Effect<ActivityReactionDTO[], never, never> {
    return Effect.succeed(this.reactionsStorage.get(activityId) ?? []);
  }

  findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Effect.Effect<ActivityReactionDTO[], never, never> {
    const reactions = this.reactionsStorage.get(activityId) ?? [];
    return Effect.succeed(reactions.filter((r) => r.userId === userId));
  }

  addReaction(
    dto: ActivityReactionDTO,
  ): Effect.Effect<ActivityReactionDTO, never, never> {
    const activityId = dto.activityId;
    const existingReactions = this.reactionsStorage.get(activityId) ?? [];

    const duplicateIndex = existingReactions.findIndex(
      (r) => r.userId === dto.userId && r.reactionType === dto.reactionType,
    );

    if (duplicateIndex !== -1) {
      existingReactions[duplicateIndex] = dto;
    } else {
      existingReactions.push(dto);
    }

    this.reactionsStorage.set(activityId, existingReactions);
    return Effect.succeed(dto);
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
