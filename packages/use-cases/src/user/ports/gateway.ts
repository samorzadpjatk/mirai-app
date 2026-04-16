import type { UserId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { UserDTO, UserPaginatedResult } from "../dto";
import type { DatabaseError } from "./errors";

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
   * Find users by role
   */
  findByRole(role: string): Effect.Effect<UserDTO[], DatabaseError, never>;

  /**
   * Find all users with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<UserPaginatedResult, DatabaseError, never>;

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
