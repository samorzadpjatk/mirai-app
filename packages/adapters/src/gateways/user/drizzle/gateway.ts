import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/domain/ports";
import { inArray } from "drizzle-orm";
import { UserDrizzleMapper } from "../../mappers/user/drizzle/mapper";
import { DatabaseError } from "@mirai-app/domain/ports";
import { BaseDrizzleGateway } from "../_shared/drizzle-base";

/**
 * DrizzleUserGateway
 *
 * Gateway implementation using Drizzle ORM for User entity.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   userGateway: asFunction(() => new DrizzleUserGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleUserGateway
  extends BaseDrizzleGateway<User, UserSelect, UserInsert, typeof users>
  implements UserRepository
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
  ): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.authUserId, authUserId))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDomain(record) : null;
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
  findByIds(ids: string[]): Effect.Effect<User[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return [];

        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.id, ids));

        return records.map((record) => this.mapper.toDomain(record));
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
  findByRole(role: UserRole): Effect.Effect<User[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.role, role));

        return records.map((record) => this.mapper.toDomain(record));
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
  searchByName(query: string): Effect.Effect<User[], DatabaseError, never> {
    return Effect.gen(this, function* () {
      const allRecords = yield* this.findAll();

      const lowerQuery = query.toLowerCase();
      return allRecords.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowerQuery) ||
          user.lastName.toLowerCase().includes(lowerQuery),
      );
    });
  }
}
