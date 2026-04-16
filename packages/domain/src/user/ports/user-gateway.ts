import type { User } from "../entities/user";
import type { UserRole } from "../../user/enums";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for user pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface UserCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for user connection pagination
 */
export interface UserConnectionArgs {
  first?: number;
  after?: UserCursorData | null;
}

/**
 * UserGateway Port
 *
 * This interface defines what operations the application needs
 * from any user gateway implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 *
 * Implementations (in adapters layer):
 * - DrizzleUserGateway: Uses Drizzle ORM
 * - InMemoryUserGateway: For testing
 */
export interface UserGateway {
  /**
   * Create a new user
   */
  create(user: User): Effect.Effect<User, DatabaseError, never>;

  /**
   * Find user by ID
   * @returns User or null if not found
   */
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;

  /**
   * Find user by auth user ID (from Supabase Auth)
   * @returns User or null if not found
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, DatabaseError, never>;

  /**
   * Find users by role with cursor-based pagination
   */
  findByRoleConnection(
    role: UserRole,
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<User>, DatabaseError, never>;

  /**
   * Find all users with cursor-based pagination
   */
  findAllConnection(
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<User>, DatabaseError, never>;

  /**
   * Update user
   */
  update(user: User): Effect.Effect<User, DatabaseError, never>;

  /**
   * Delete user
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if user exists by auth user ID
   */
  existsByAuthUserId(
    authUserId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;
}
