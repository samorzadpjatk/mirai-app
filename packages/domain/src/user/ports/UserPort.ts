import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { User } from "../entities/User";
import type { UserId } from "../value-objects/UserId";

/**
 * User Repository Port
 *
 * Defines the interface for user persistence operations.
 */
export interface IUserPort {
  /**
   * Find user by ID
   */
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never>;

  /**
   * Find user by auth user ID
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, DatabaseError, never>;

  /**
   * Find all users
   */
  findAll(): Effect.Effect<User[], DatabaseError, never>;

  /**
   * Create new user
   */
  create(user: User): Effect.Effect<User, DatabaseError, never>;

  /**
   * Update existing user
   */
  update(user: User): Effect.Effect<User, DatabaseError, never>;

  /**
   * Delete user by ID
   */
  delete(id: UserId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if user exists
   */
  exists(id: UserId): Effect.Effect<boolean, DatabaseError, never>;
}
