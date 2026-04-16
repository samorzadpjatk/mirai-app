import { sql, eq, and, gte, lte, asc } from "drizzle-orm";
import {
  trips,
  type TripSelect,
  type TripInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { type TripStatus, type Connection } from "@mirai-app/domain";
import type {
  TripGateway,
  TripDTO,
  TripPaginatedResult,
  TripConnectionArgs,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { TripDrizzleMapper } from "../../../trip/mappers/drizzle/mapper";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * DrizzleTripGateway
 *
 * Gateway implementation using Drizzle ORM for Trip entity.
 * Returns TripDTOs instead of domain entities to satisfy the TripGateway interface.
 */
export class DrizzleTripGateway
  extends BaseDrizzleGateway<TripDTO, TripSelect, TripInsert, typeof trips>
  implements TripGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: trips,
      mapper: TripDrizzleMapper.instance,
    });
  }

  /**
   * Find trips by status
   */
  findByStatus(
    status: TripStatus,
  ): Effect.Effect<TripDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));

        return records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find trips by status",
          cause: error,
        }),
    });
  }

  /**
   * Find active trips (trips where current time is between start and end dates)
   */
  findActive(): Effect.Effect<TripDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              lte(this.table.startDate, now),
              gte(this.table.endDate, now),
              eq(this.table.status, "ACTIVE"),
            ),
          );

        return records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active trips",
          cause: error,
        }),
    });
  }

  /**
   * Find trips with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<TripPaginatedResult, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);
        const total = countResult?.count ?? 0;

        // Get paginated records
        let query = this.db.select().from(this.table);

        if (limit) {
          query = query.limit(limit) as typeof query;
        }
        if (offset) {
          query = query.offset(offset) as typeof query;
        }

        const records = await query;
        const items = records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );

        const hasMore = items.length === limit && offset + items.length < total;

        return {
          items,
          total,
          limit,
          offset,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find trips with pagination",
          cause: error,
        }),
    });
  }

  /**
   * Update trip status
   */
  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<TripDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ status, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();

        if (!record) {
          throw new Error(`Trip with id ${id} not found`);
        }

        return TripDrizzleMapper.instance.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update trip status for id ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Count trips by status
   */
  countByStatus(
    status: TripStatus,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.status, status));

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByStatus",
          message: "Failed to count trips by status",
          cause: error,
        }),
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all trips with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findAllConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(args, undefined, "findAllConnection");
  }

  /**
   * Find trips by status with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByStatusConnection(
    status: TripStatus,
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      args,
      () => eq(this.table.status, status),
      "findByStatusConnection",
    );
  }

  /**
   * Find active trips with cursor-based pagination
   * Active trips: current time is between start and end dates with ACTIVE status
   */
  findActiveConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      args,
      () =>
        and(
          lte(this.table.startDate, now),
          gte(this.table.endDate, now),
          eq(this.table.status, "ACTIVE"),
        ),
      "findActiveConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) > (cursor.createdAt, cursor.id) WHERE clause
   * Uses ORDER BY createdAt DESC, id DESC with LIMIT first + 1
   */
  private executeConnectionQuery(
    args: TripConnectionArgs,
    buildFilterCondition:
      | (() => ReturnType<typeof eq> | ReturnType<typeof and> | undefined)
      | undefined,
    operation: string,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions: Array<
          | ReturnType<typeof eq>
          | ReturnType<typeof and>
          | ReturnType<typeof sql>
        > = [];

        // Add filter condition if provided
        if (buildFilterCondition) {
          const filterCondition = buildFilterCondition();
          if (filterCondition) {
            conditions.push(filterCondition);
          }
        }

        // Add cursor condition: (createdAt, id) < (cursor.createdAt, cursor.id) for DESC order
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(
            sql`${this.table.createdAt} DESC`,
            sql`${this.table.id} DESC`,
          )
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

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
            hasPreviousPage: !!cursor,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation,
          message: `Failed to execute ${operation}`,
          cause: error,
        }),
    });
  }
}
