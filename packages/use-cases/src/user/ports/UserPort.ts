import { Context, Effect } from "effect";
import type { User, IPortError } from "@mirai-app/domain";
import type { UserId } from "@mirai-app/domain";

/**
 * User Port - Repository interface with Context.Tag for Effect DI
 *
 * This interface defines what operations the application needs
 * from any User storage implementation.
 */
export interface IUserPort {
  /**
   * Find user by ID
   * @returns User or null if not found
   */
  findById(id: UserId): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find user by auth user ID
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find users by trip participant
   */
  findByTripId(tripId: string): Effect.Effect<User[], IPortError, never>;

  /**
   * Find all users with pagination
   */
  findAll(params: {
    limit: number;
    offset: number;
  }): Effect.Effect<User[], IPortError, never>;

  /**
   * Search users
   */
  search(params: {
    tripId: string;
    field: string;
    searchTerm?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      users: User[];
      total: number;
      hasMore: boolean;
    },
    IPortError,
    never
  >;

  /**
   * Create new user
   */
  create(user: User): Effect.Effect<User, IPortError, never>;

  /**
   * Update existing user
   */
  update(user: User): Effect.Effect<User, IPortError, never>;

  /**
   * Delete user by ID
   */
  delete(id: UserId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if user exists
   */
  exists(id: UserId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count users
   */
  count(): Effect.Effect<number, IPortError, never>;
}

/**
 * Context.Tag for UserPort - enables dependency injection with Effect
 */
export class UserPortTag extends Context.Tag("UserPort")<
  UserPortTag,
  IUserPort
>() {}
