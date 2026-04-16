import type { PushSubscriptionDTO } from "@mirai-app/use-cases";
import type {
  PushSubscriptionGateway,
  PushSubscriptionConnection,
} from "@mirai-app/use-cases";
import type { Connection, ForwardPaginationArgs } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";
import {
  encodeCursor,
  decodeCursor,
} from "@mirai-app/use-cases/system/utils/cursor";

/**
 * In-Memory PushSubscription Gateway for Testing
 *
 * Implements PushSubscriptionGateway port with in-memory storage.
 * Provides methods for managing push notification subscriptions.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryPushSubscriptionGateway();
 * gateway.seed([mockPushSubscriptionDTO]);
 *
 * // Find by user
 * const userSubscriptions = await Effect.runPromise(gateway.findByUserId("user-123"));
 *
 * // Check if user has subscriptions
 * const hasSubs = await Effect.runPromise(gateway.hasSubscriptions("user-123"));
 *
 * gateway.reset();
 * ```
 */
export class InMemoryPushSubscriptionGateway
  extends InMemoryGateway<PushSubscriptionDTO>
  implements PushSubscriptionGateway
{
  create(
    subscription: PushSubscriptionDTO,
  ): Effect.Effect<PushSubscriptionDTO, DatabaseError, never> {
    return this.createGeneric(subscription);
  }

  findById(
    id: string,
  ): Effect.Effect<PushSubscriptionDTO | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  update(
    subscription: PushSubscriptionDTO,
  ): Effect.Effect<PushSubscriptionDTO, DatabaseError, never> {
    return this.updateGeneric(subscription);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  deleteByUserId(userId: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const toDelete = this.getAllItems().filter((s) => s.userId === userId);
      for (const item of toDelete) {
        this.storage.delete(item.id);
      }
    });
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  hasSubscriptions(
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(this.getAllItems().some((s) => s.userId === userId));
  }

  countByUserId(userId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((s) => s.userId === userId).length,
    );
  }

  /**
   * Find push subscriptions for a user (non-paginated, sorted by createdAt, id)
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<PushSubscriptionDTO[], DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems()
        .filter((s) => s.userId === userId)
        .sort((a, b) => {
          const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
          if (timeDiff !== 0) return timeDiff;
          return a.id.localeCompare(b.id);
        });
    });
  }

  /**
   * Find push subscriptions by platform (non-paginated, sorted by createdAt, id)
   */
  findByPlatform(
    platform: string,
  ): Effect.Effect<PushSubscriptionDTO[], DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems()
        .filter((s) => s.platform === platform)
        .sort((a, b) => {
          const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
          if (timeDiff !== 0) return timeDiff;
          return a.id.localeCompare(b.id);
        });
    });
  }

  /**
   * Find push subscriptions for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<PushSubscriptionDTO>, DatabaseError, never> {
    const limit = Math.min(args.first ?? 20, 100);
    const afterCursor = args.after ? decodeCursor(args.after) : null;

    // Filter by user and sort by (createdAt, id)
    let items = this.getAllItems()
      .filter((s) => s.userId === userId)
      .sort((a, b) => {
        // Sort by createdAt first, then by id as tiebreaker
        const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });

    // Apply cursor pagination
    if (afterCursor) {
      const cursorDate = new Date(afterCursor.createdAt);
      items = items.filter((item) => {
        const itemTime = item.createdAt.getTime();
        const cursorTime = cursorDate.getTime();
        if (itemTime > cursorTime) return true;
        if (itemTime < cursorTime) return false;
        // Equal times - compare by id
        return item.id.localeCompare(afterCursor.id) > 0;
      });
    }

    // Get limit + 1 to determine hasNextPage
    const hasMore = items.length > limit;
    const paginatedItems = items.slice(0, limit);

    // Build edges with cursors
    const edges = paginatedItems.map((item) => ({
      node: item,
      cursor: encodeCursor({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
      }),
    }));

    return Effect.succeed({
      edges,
      nodes: paginatedItems,
      pageInfo: {
        hasNextPage: hasMore,
        hasPreviousPage: !!afterCursor,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    });
  }

  /**
   * Find push subscriptions by platform with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByPlatformConnection(
    platform: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<PushSubscriptionDTO>, DatabaseError, never> {
    const limit = Math.min(args.first ?? 20, 100);
    const afterCursor = args.after ? decodeCursor(args.after) : null;

    // Filter by platform and sort by (createdAt, id)
    let items = this.getAllItems()
      .filter((s) => s.platform === platform)
      .sort((a, b) => {
        // Sort by createdAt first, then by id as tiebreaker
        const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });

    // Apply cursor pagination
    if (afterCursor) {
      const cursorDate = new Date(afterCursor.createdAt);
      items = items.filter((item) => {
        const itemTime = item.createdAt.getTime();
        const cursorTime = cursorDate.getTime();
        if (itemTime > cursorTime) return true;
        if (itemTime < cursorTime) return false;
        // Equal times - compare by id
        return item.id.localeCompare(afterCursor.id) > 0;
      });
    }

    // Get limit + 1 to determine hasNextPage
    const hasMore = items.length > limit;
    const paginatedItems = items.slice(0, limit);

    // Build edges with cursors
    const edges = paginatedItems.map((item) => ({
      node: item,
      cursor: encodeCursor({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
      }),
    }));

    return Effect.succeed({
      edges,
      nodes: paginatedItems,
      pageInfo: {
        hasNextPage: hasMore,
        hasPreviousPage: !!afterCursor,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    });
  }
}
