import type { NotificationDTO } from "@mirai-app/use-cases";
import type {
  NotificationStatus,
  NotificationPriority,
  Connection,
  ForwardPaginationArgs,
} from "@mirai-app/domain";
import type { NotificationGateway } from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";
import {
  encodeCursor,
  decodeCursor,
} from "@mirai-app/use-cases/system/utils/cursor";

/**
 * In-Memory Notification Gateway for Testing
 *
 * Implements NotificationGateway port with in-memory storage.
 * Provides methods for managing notifications including status tracking,
 * scheduling, priority management, and querying by various criteria.
 *
 * All methods return NotificationDTOs instead of domain entities.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryNotificationGateway();
 * gateway.seed([mockNotificationDTO]);
 *
 * // Find by trip
 * const tripNotifications = await Effect.runPromise(gateway.findByTripId("trip-123"));
 *
 * // Find ready to send
 * const ready = await Effect.runPromise(gateway.findReadyToSend());
 *
 * // Count by status
 * const pendingCount = await Effect.runPromise(gateway.countByStatus("DRAFT"));
 *
 * gateway.reset();
 * ```
 */
export class InMemoryNotificationGateway
  extends InMemoryGateway<NotificationDTO>
  implements NotificationGateway
{
  create(
    notification: NotificationDTO,
  ): Effect.Effect<NotificationDTO, DatabaseError, never> {
    return this.createGeneric(notification);
  }

  findById(
    id: string,
  ): Effect.Effect<NotificationDTO | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<
    import("@mirai-app/use-cases").NotificationPaginatedResult,
    DatabaseError,
    never
  > {
    return Effect.gen(this, function* () {
      const items = yield* this.findAllGeneric(options);
      const totalCount = this.storage.size;

      return {
        items,
        totalCount,
        hasMore:
          options?.offset !== undefined
            ? options.offset + items.length < totalCount
            : false,
      };
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.tripId === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByStatus(
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.status === status)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.tripId === tripId && n.status === status)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByPriority(
    priority: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.priority === priority)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findReadyToSend(): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    const now = Date.now();
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => {
          if (n.status !== ("READY" as NotificationStatus)) return false;
          if (!n.scheduledAt) return true;
          return n.scheduledAt.getTime() <= now;
        })
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = {
            URGENT: 4,
            HIGH: 3,
            NORMAL: 2,
            LOW: 1,
          };
          const priorityDiff =
            (priorityOrder[b.priority as string] ?? 0) -
            (priorityOrder[a.priority as string] ?? 0);
          if (priorityDiff !== 0) return priorityDiff;
          return a.createdAt.getTime() - b.createdAt.getTime();
        }),
    );
  }

  findOverdue(): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    const now = Date.now();
    return Effect.succeed(
      this.getAllItems()
        .filter(
          (n) =>
            n.status === ("DRAFT" as NotificationStatus) &&
            n.scheduledAt !== null &&
            n.scheduledAt.getTime() < now,
        )
        .sort((a, b) => {
          const aTime = a.scheduledAt?.getTime() ?? 0;
          const bTime = b.scheduledAt?.getTime() ?? 0;
          return aTime - bTime;
        }),
    );
  }

  findByCreatedById(
    createdById: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.createdById === createdById)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  update(
    notification: NotificationDTO,
  ): Effect.Effect<NotificationDTO, DatabaseError, never> {
    return this.updateGeneric(notification);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  countByStatus(status: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((n) => n.status === status).length,
    );
  }

  countPendingByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (n) =>
          n.tripId === tripId &&
          (n.status === ("DRAFT" as NotificationStatus) ||
            n.status === ("READY" as NotificationStatus)),
      ).length,
    );
  }

  /**
   * Find notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<NotificationDTO>, DatabaseError, never> {
    const limit = Math.min(args.first ?? 20, 100);
    const afterCursor = args.after ? decodeCursor(args.after) : null;

    // Filter by user and sort by (createdAt, id)
    let items = this.getAllItems()
      .filter((n) => n.createdById === userId)
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
   * Find unread notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   * Note: For broadcast notifications, "unread" is determined by status != SENT
   * and scheduledAt being in the past or null
   */
  findUnreadByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<NotificationDTO>, DatabaseError, never> {
    const limit = Math.min(args.first ?? 20, 100);
    const afterCursor = args.after ? decodeCursor(args.after) : null;
    const now = Date.now();

    // Filter by user and "unread" criteria, sort by (createdAt, id)
    let items = this.getAllItems()
      .filter((n) => {
        // Must be created by this user
        if (n.createdById !== userId) return false;
        // Unread: not yet sent (DRAFT or READY status)
        if (n.status !== "DRAFT" && n.status !== "READY") return false;
        // And either not scheduled or scheduled for the past
        if (n.scheduledAt && n.scheduledAt.getTime() > now) return false;
        return true;
      })
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
