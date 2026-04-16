import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { UserRole } from "@mirai-app/domain";
import type {
  UserGateway,
  UserDTO,
  UserPaginatedResult,
} from "@mirai-app/use-cases";
import { inArray, sql } from "drizzle-orm";
import { UserDrizzleMapper } from "../../../user/mappers/drizzle/mapper";
import { DatabaseError } from "@mirai-app/domain";
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
   * Find all users with pagination
   *
   * Overrides base class to return paginated result instead of array.
   */
  // @ts-expect-error - Intentionally different return type from base class to satisfy interface
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<UserPaginatedResult, DatabaseError, never> {
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
        const items = records.map((record) => this.mapper.toDTO(record));

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
          message: "Failed to find all users",
          cause: error,
        }),
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
   * Find users by their role
   */
  findByRole(role: UserRole): Effect.Effect<UserDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.role, role));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByRole",
          message: "Failed to find users by role",
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
}
