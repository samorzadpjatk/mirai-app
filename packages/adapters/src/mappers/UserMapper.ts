import { User, UserRole } from "@repo/domain";
import type { UserRepository } from "@repo/use-cases";

/**
 * UserMapper
 *
 * Maps between Prisma database records and domain User entities.
 * This is a pure function with no side effects.
 */
export class UserMapper {
  /**
   * Convert a Prisma User record to a domain User entity
   */
  static toDomain(record: {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: string;
    hasAvatar: boolean;
    lastSeenOn: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    // Map Prisma role string to UserRole enum
    const role = UserMapper.mapRoleFromPrisma(record.role);

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
      throw new Error(`Failed to map User from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain User entity to Prisma create input
   */
  static toPrismaCreate(user: User): {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: string;
    hasAvatar: boolean;
    lastSeenOn: Date | null;
  } {
    return {
      id: user.id,
      authUserId: user.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hasAvatar: user.hasAvatar,
      lastSeenOn: user.lastSeenOn,
    };
  }

  /**
   * Convert a domain User entity to Prisma update input
   */
  static toPrismaUpdate(user: User): {
    firstName: string;
    lastName: string;
    role: string;
    hasAvatar: boolean;
    lastSeenOn: Date | null;
  } {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hasAvatar: user.hasAvatar,
      lastSeenOn: user.lastSeenOn,
    };
  }

  /**
   * Map Prisma role string to UserRole enum
   */
  private static mapRoleFromPrisma(role: string): UserRole {
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
}
