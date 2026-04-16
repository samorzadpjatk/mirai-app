import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq, and, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { UserRole, type Connection, DatabaseError } from "@mirai-app/domain";
import type {
  UserGateway,
  UserDTO,
  UserConnectionArgs,
} from "@mirai-app/use-cases";
import { inArray } from "drizzle-orm";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { UserDrizzleMapper } from "../../../user/mappers/drizzle/mapper";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * DrizzleUserGateway
 *
 * Gateway implementation using Drizzle ORM for User entity.
 * Returns UserDTOs instead of domain entities to satisfy the UserGateway interface.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   userGateway: asFunction(() => new DrizzleUserGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleUserGateway
  extends BaseDrizzleGateway<UserDTO, UserSelect, UserInsert, typeof users>
  implements UserGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: users,
      mapper: UserDrizzleMapper.instance,
    });
  }

  /**
   * Find a user by their authUserId
   *
   * This is the primary lookup method for user authentication.
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<UserDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.authUserId, authUserId))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByAuthUserId",
          message: "Failed to find user by authUserId",
          cause: error,
        }),
    });
  }

  /**
   * Find users by their IDs
   */
  findByIds(ids: string[]): Effect.Effect<UserDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return [];

        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.id, ids));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByIds",
          message: "Failed to find users by IDs",
          cause: error,
        }),
    });
  }

  /**
   * Check if a user exists by authUserId
   */
  existsByAuthUserId(
    authUserId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ id: this.table.id })
          .from(this.table)
          .where(eq(this.table.authUserId, authUserId))
          .limit(1);

        return records.length > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsByAuthUserId",
          message: "Failed to check user existence",
          cause: error,
        }),
    });
  }

  /**
   * Update a user's lastSeenOn timestamp
   */
  updateLastSeen(
    id: string,
    lastSeenOn: Date,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(this.table)
          .set({ lastSeenOn, updatedAt: new Date() })
          .where(eq(this.table.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateLastSeen",
          message: "Failed to update last seen timestamp",
          cause: error,
        }),
    });
  }

  /**
   * Search users by name (firstName or lastName)
   */
  searchByName(query: string): Effect.Effect<UserDTO[], DatabaseError, never> {
    return Effect.gen(this, function* () {
      const paginatedResult = yield* this.findAll();
      const allRecords = paginatedResult.items;

      const lowerQuery = query.toLowerCase();
      return allRecords.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(lowerQuery) ||
          user.lastName?.toLowerCase().includes(lowerQuery),
      );
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all users with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findAllConnection(
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(args, undefined, "findAllConnection");
  }

  /**
   * Find users by role with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByRoleConnection(
    role: UserRole,
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      args,
      () => eq(this.table.role, role),
      "findByRoleConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) < (cursor.createdAt, cursor.id) WHERE clause for DESC order
   * Uses ORDER BY createdAt DESC, id DESC with LIMIT first + 1
   */
  private executeConnectionQuery(
    args: UserConnectionArgs,
    buildFilterCondition:
      | (() => ReturnType<typeof eq> | ReturnType<typeof and> | undefined)
      | undefined,
    operation: string,
  ): Effect.Effect<Connection<UserDTO>, DatabaseError, never> {
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
