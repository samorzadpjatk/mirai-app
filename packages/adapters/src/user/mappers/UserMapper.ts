import type { UserSelect } from "../../infrastructure/drizzle";
import { User, UserId, AuthUserId } from "@mirai-app/domain";
import type { ValidationError } from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * User Mapper
 *
 * Maps between database User records and domain User entities.
 */
export class UserMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(dbUser: UserSelect): Effect.Effect<User, ValidationError, never> {
    return User.create({
      id: UserId.unsafeCreate(dbUser.id),
      authUserId: AuthUserId.unsafeCreate(dbUser.authUserId),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      hasAvatar: dbUser.hasAvatar,
      role: dbUser.role,
      lastSeenOn: dbUser.lastSeenOn,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(user: User): {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    hasAvatar: boolean;
    role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
    lastSeenOn: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: UserId.toString(user.id),
      authUserId: AuthUserId.toString(user.authUserId),
      firstName: user.firstName,
      lastName: user.lastName,
      hasAvatar: user.hasAvatar,
      role: user.role,
      lastSeenOn: user.lastSeenOn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(user: User): {
    firstName: string;
    lastName: string;
    hasAvatar: boolean;
    role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
    lastSeenOn: Date | null;
    updatedAt: Date;
  } {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      hasAvatar: user.hasAvatar,
      role: user.role,
      lastSeenOn: user.lastSeenOn,
      updatedAt: new Date(),
    };
  }
}

export const userMapper = new UserMapper();
