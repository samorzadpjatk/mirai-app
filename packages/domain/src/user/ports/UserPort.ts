import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
   * @param authToken - Optional auth token for access verification
   */
  findById(
    id: UserId,
    authToken?: string,
  ): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find user by auth user ID
   * @param authToken - Optional auth token for access verification
   */
  findByAuthUserId(
    authUserId: string,
    authToken?: string,
  ): Effect.Effect<User | null, IPortError, never>;

  /**
   * Find users by trip participant
   * @param authToken - Optional auth token for access verification
   */
  findByTripId(
    tripId: string,
    authToken?: string,
  ): Effect.Effect<User[], IPortError, never>;

  /**
   * Find all users
   * @param authToken - Optional auth token for access verification
   */
  findAll(authToken?: string): Effect.Effect<User[], IPortError, never>;

  /**
   * Find all users with pagination
   * @param authToken - Optional auth token for access verification
   */
  findAllPaginated(
    params: {
      limit: number;
      offset: number;
    },
    authToken?: string,
  ): Effect.Effect<User[], IPortError, never>;

  /**
   * Search users
   * @param authToken - Optional auth token for access verification
   */
  search(
    params: {
      tripId: string;
      field: string;
      searchTerm?: string;
      limit: number;
      offset: number;
    },
    authToken?: string,
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
   * @param authToken - Optional auth token for access verification
   */
  create(
    user: User,
    authToken?: string,
  ): Effect.Effect<User, IPortError, never>;

  /**
   * Update existing user
   * @param authToken - Optional auth token for access verification
   */
  update(
    user: User,
    authToken?: string,
  ): Effect.Effect<User, IPortError, never>;

  /**
   * Delete user by ID
   * @param authToken - Optional auth token for access verification
   */
  delete(
    id: UserId,
    authToken?: string,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Check if user exists
   * @param authToken - Optional auth token for access verification
   */
  exists(
    id: UserId,
    authToken?: string,
  ): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count users
   * @param authToken - Optional auth token for access verification
   */
  count(authToken?: string): Effect.Effect<number, IPortError, never>;
}
