import type { UserId, Connection, DatabaseError } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { UserDTO } from "../dto";

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
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleUserGateway: Uses Drizzle ORM
 * - InMemoryUserGateway: For testing
 */
export interface UserGateway {
  /**
   * Create a new user
   */
  create(user: UserDTO): Effect.Effect<UserDTO, DatabaseError, never>;

  /**
   * Find user by ID
   * @returns UserDTO or null if not found
   */
  findById(id: UserId): Effect.Effect<UserDTO | null, DatabaseError, never>;

  /**
   * Find user by auth user ID (from Supabase Auth)
   * @returns UserDTO or null if not found
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<UserDTO | null, DatabaseError, never>;

  /**
   * Find all users with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findAllConnection(
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, DatabaseError, never>;

  /**
   * Find users by role with cursor-based pagination
   */
  findByRoleConnection(
    role: string,
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, DatabaseError, never>;

  /**
   * Update user
   */
  update(user: UserDTO): Effect.Effect<UserDTO, DatabaseError, never>;

  /**
   * Delete user
   */
  delete(id: UserId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if user exists by auth user ID
   */
  existsByAuthUserId(
    authUserId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;
}

/**
 * UserGateway Context.Tag for Effect dependency injection
 */
export class UserGatewayTag extends Context.Tag("UserGateway")<
  UserGatewayTag,
  UserGateway
>() {}
