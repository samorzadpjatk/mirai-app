import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { User } from "../entities/User";
import type { UserId } from "../value-objects/UserId";

/**
 * User Repository Port
 *
 * Defines the interface for user persistence operations.
 * Authorization is handled via IAuthZPort.verifyAccess using AuthContext.
 */
export interface IUserPort {
  /**
   * Find user by ID
   */
  findById(
    id: UserId,
  ): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find user by auth user ID
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find users by trip participant
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<User[], IPortError, never>;

  /**
   * Find all users
   */
  findAll(): Effect.Effect<User[], IPortError, never>;

  /**
   * Find all users with pagination
   */
  findAllPaginated(
    params: {
      limit: number;
      offset: number;
    },
  ): Effect.Effect<User[], IPortError, never>;

  /**
   * Search users
   */
  search(
    params: {
      tripId: string;
      field: string;
      searchTerm?: string;
      limit: number;
      offset: number;
    },
  ): Effect.Effect<
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
  create(
    user: User,
  ): Effect.Effect<User, IPortError, never>;

  /**
   * Update existing user
   */
  update(
    user: User,
  ): Effect.Effect<User, IPortError, never>;

  /**
   * Delete user by ID
   */
  delete(
    id: UserId,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Check if user exists
   */
  exists(
    id: UserId,
  ): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count users
   */
  count(): Effect.Effect<number, IPortError, never>;
}
