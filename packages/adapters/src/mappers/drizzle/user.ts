import { User, UserRole } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  users,
  UserSelect,
  UserInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * UserDrizzleMapper
 *
 * Maps between Drizzle database records and domain User entities.
 * Follows the same pattern as UserMapper but for Drizzle ORM.
 *
 * This mapper enables Phase 1 migration: Prisma to Drizzle.
 * It produces identical domain entities from both ORMs.
 */
export class UserDrizzleMapper implements DrizzleEntityMapper<
  User,
  UserSelect,
  UserInsert
> {
  /**
   * Convert a Drizzle User record to a domain User entity
   */
  toDomain(record: UserSelect): User {
    // Map Drizzle role string to UserRole enum
    const role = this.mapRoleFromDrizzle(record.role);

    const result = User.create({
      id: record.id,
      authUserId: record.authUserId,
      firstName: record.firstName,
      lastName: record.lastName,
      role,
      hasAvatar: record.hasAvatar,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastSeenOn: record.lastSeenOn,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(`Failed to map User from Drizzle: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain User entity to Drizzle insert input
   */
  toDrizzleInsert(user: User): UserInsert {
    return {
      id: user.id,
      authUserId: user.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hasAvatar: user.hasAvatar,
      lastSeenOn: user.lastSeenOn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convert a domain User entity to Drizzle update input
   *
   * Note: id and createdAt are typically not updated
   */
  toDrizzleUpdate(user: User): Partial<UserInsert> {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hasAvatar: user.hasAvatar,
      lastSeenOn: user.lastSeenOn,
      updatedAt: new Date(), // Always update the updatedAt timestamp
    };
  }

  /**
   * Map Drizzle role string to UserRole enum
   */
  private mapRoleFromDrizzle(role: string): UserRole {
    switch (role) {
      case "ADMIN":
        return UserRole.ADMIN;
      case "MODERATOR":
        return UserRole.MODERATOR;
      case "SERVICE":
        return UserRole.SERVICE;
      case "USER":
      default:
        return UserRole.USER;
    }
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new UserDrizzleMapper();
}
