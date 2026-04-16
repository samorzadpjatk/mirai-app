import { Effect } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import type { UserDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  users,
  UserSelect,
  UserInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * UserDrizzleMapper
 *
 * Maps between Drizzle database records and domain User entities or UserDTOs.
 * Follows the same pattern as UserMapper but for Drizzle ORM.
 *
 * This mapper enables Phase 1 migration: Prisma to Drizzle.
 * It produces identical domain entities or DTOs from both ORMs.
 */
export class UserDrizzleMapper implements DrizzleEntityMapper<
  UserDTO,
  UserSelect,
  UserInsert
> {
  /**
   * Convert a Drizzle User record to a UserDTO
   */
  toDTO(record: UserSelect): UserDTO {
    return {
      id: record.id,
      authUserId: record.authUserId,
      firstName: record.firstName,
      lastName: record.lastName,
      nickname: record.nickname,
      email: record.email,
      phone: record.phone,
      avatarUrl: record.avatarUrl,
      role: this.mapRoleFromDrizzle(record.role),
      status: record.status,
      groupId: record.groupId,
      bio: record.bio,
      birthDate: record.birthDate,
      shirtSize: record.shirtSize,
      dietaryRequirements: record.dietaryRequirements,
      medicalInfo: record.medicalInfo,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a Drizzle User record to a domain User entity
   */
  toDomain(record: UserSelect): User {
    // Map Drizzle role string to UserRole enum
    const role = this.mapRoleFromDrizzle(record.role);

    const effect = User.create({
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

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    // This should never fail if database has valid data
    if (exit._tag === "Failure") {
      throw new Error(`Failed to map User from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a domain User entity to Drizzle insert input
   */
  toDrizzleInsert(user: UserDTO): UserInsert {
    return {
      id: user.id,
      authUserId: user.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      groupId: user.groupId,
      bio: user.bio,
      birthDate: user.birthDate,
      shirtSize: user.shirtSize,
      dietaryRequirements: user.dietaryRequirements,
      medicalInfo: user.medicalInfo,
      hasAvatar: user.avatarUrl != null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeenOn: null,
    };
  }

  /**
   * Convert a domain User entity to Drizzle update input
   *
   * Note: id and createdAt are typically not updated
   */
  toDrizzleUpdate(user: UserDTO): Partial<UserInsert> {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      groupId: user.groupId,
      bio: user.bio,
      birthDate: user.birthDate,
      shirtSize: user.shirtSize,
      dietaryRequirements: user.dietaryRequirements,
      medicalInfo: user.medicalInfo,
      hasAvatar: user.avatarUrl != null,
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
