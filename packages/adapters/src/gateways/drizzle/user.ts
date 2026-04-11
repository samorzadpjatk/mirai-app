import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq } from "drizzle-orm";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/use-cases";
import { inArray } from "drizzle-orm";
import { BaseDrizzleRepository } from "../base/repository";
import { UserDrizzleMapper } from "../../mappers/drizzle/user";

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
  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.authUserId, authUserId))
      .limit(1);

    const record = records[0];
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find users by their IDs
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const records = await this.db
      .select()
      .from(this.table)
      .where(inArray(this.table.id, ids));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find users by their role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.role, role));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Check if a user exists by authUserId
   */
  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    const records = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.authUserId, authUserId))
      .limit(1);

    return records.length > 0;
  }

  /**
   * Update a user's lastSeenOn timestamp
   */
  async updateLastSeen(id: string, lastSeenOn: Date): Promise<void> {
    await this.db
      .update(this.table)
      .set({ lastSeenOn, updatedAt: new Date() })
      .where(eq(this.table.id, id));
  }

  /**
   * Search users by name (firstName or lastName)
   */
  async searchByName(query: string): Promise<User[]> {
    // For simplicity, we fetch all and filter in memory
    // In production, use ILIKE with drizzle-orm/sql
    const allRecords = await this.findAll();

    const lowerQuery = query.toLowerCase();
    return allRecords.filter(
      (user) =>
        user.firstName.toLowerCase().includes(lowerQuery) ||
        user.lastName.toLowerCase().includes(lowerQuery),
    );
  }
}
