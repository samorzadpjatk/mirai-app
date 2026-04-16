import {
  pushSubscriptions,
  type PushSubscriptionSelect,
  type PushSubscriptionInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq, and, sql, inArray, asc } from "drizzle-orm";
import { Effect } from "effect";
import type {
  PushSubscriptionGateway,
  PushSubscriptionDTO,
  PushSubscriptionConnection,
} from "@mirai-app/use-cases";
import type { Connection, ForwardPaginationArgs } from "@mirai-app/domain";
import {
  encodeCursor,
  decodeCursor,
} from "@mirai-app/use-cases/system/utils/cursor";
import { PushSubscriptionDrizzleMapper } from "../../../notification/mappers/drizzle/push-subscription-mapper";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * DrizzlePushSubscriptionGateway
 *
 * Gateway implementation using Drizzle ORM for PushSubscription entity.
 * Returns PushSubscriptionDTOs instead of domain entities to satisfy the PushSubscriptionGateway interface.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   pushSubscriptionGateway: asFunction(() => new DrizzlePushSubscriptionGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzlePushSubscriptionGateway
  extends BaseDrizzleGateway<
    PushSubscriptionDTO,
    PushSubscriptionSelect,
    PushSubscriptionInsert,
    typeof pushSubscriptions
  >
  implements PushSubscriptionGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: pushSubscriptions,
      mapper: PushSubscriptionDrizzleMapper.instance,
    });
  }

  /**
   * Delete all push subscriptions for a user
   */
  deleteByUserId(userId: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(this.table).where(eq(this.table.userId, userId));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "deleteByUserId",
          message: "Failed to delete push subscriptions by user ID",
          cause: error,
        }),
    });
  }

  /**
   * Check if user has any push subscriptions
   */
  hasSubscriptions(
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.userId, userId));

        return (result[0]?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hasSubscriptions",
          message: "Failed to check if user has push subscriptions",
          cause: error,
        }),
    });
  }

  /**
   * Count push subscriptions for a user
   */
  countByUserId(userId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.userId, userId));

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByUserId",
          message: "Failed to count push subscriptions by user ID",
          cause: error,
        }),
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find push subscriptions for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<PushSubscriptionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(args.first ?? 20, 100);
        const afterCursor = args.after ? decodeCursor(args.after) : null;

        // Build WHERE conditions
        const conditions = [eq(this.table.userId, userId)];

        // Add cursor pagination: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (afterCursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${new Date(afterCursor.createdAt)}, ${afterCursor.id})`,
          );
        }

        // Fetch limit + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        // Build edges with cursors
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        }));

        return {
          edges,
          nodes: items,
          pageInfo: {
            hasNextPage: hasMore,
            hasPreviousPage: !!afterCursor,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserIdConnection",
          message:
            "Failed to find push subscriptions by user ID with pagination",
          cause: error,
        }),
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
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(args.first ?? 20, 100);
        const afterCursor = args.after ? decodeCursor(args.after) : null;

        // Build WHERE conditions
        const conditions = [eq(this.table.platform, platform)];

        // Add cursor pagination: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (afterCursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${new Date(afterCursor.createdAt)}, ${afterCursor.id})`,
          );
        }

        // Fetch limit + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        // Build edges with cursors
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        }));

        return {
          edges,
          nodes: items,
          pageInfo: {
            hasNextPage: hasMore,
            hasPreviousPage: !!afterCursor,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByPlatformConnection",
          message:
            "Failed to find push subscriptions by platform with pagination",
          cause: error,
        }),
    });
  }
}
