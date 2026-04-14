import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/use-cases";
import { inArray } from "drizzle-orm";
import { BaseDrizzleRepository } from "../base/repository";
import { UserDrizzleMapper } from "../../mappers/drizzle/user";
import { DatabaseError } from "@mirai-app/adapters/errors";

/**
 * DrizzleUserRepository
 *
 * Repository implementation using Drizzle ORM for User entity.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   userRepository: asFunction(() => new DrizzleUserRepository(db)).singleton(),
 * });
 * ```
 */
export class DrizzleUserRepository
  extends BaseDrizzleRepository<User, UserSelect, UserInsert, typeof users>
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
  ): Effect.Effect<User | null, never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Find users by their IDs
   */
  findByIds(ids: string[]): Effect.Effect<User[], never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Find users by their role
   */
  findByRole(role: UserRole): Effect.Effect<User[], never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Check if a user exists by authUserId
   */
  existsByAuthUserId(authUserId: string): Effect.Effect<boolean, never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Update a user's lastSeenOn timestamp
   */
  updateLastSeen(
    id: string,
    lastSeenOn: Date,
  ): Effect.Effect<void, never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Search users by name (firstName or lastName)
   */
  searchByName(query: string): Effect.Effect<User[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const allRecords = await this.findAll();

        const lowerQuery = query.toLowerCase();
        return allRecords.filter(
          (user) =>
            user.firstName.toLowerCase().includes(lowerQuery) ||
            user.lastName.toLowerCase().includes(lowerQuery),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "searchByName",
          message: "Failed to search users by name",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }
}
