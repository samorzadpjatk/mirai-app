import type { User, UserRole } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

/**
 * UserRepository Port
 *
 * This interface defines what operations the application needs
 * from any user repository implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 *
 * Implementations (in adapters layer):
 * - PrismaUserRepository: Uses Prisma ORM
 * - InMemoryUserRepository: For testing
 */
export interface UserRepository {
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
   * Find users by role
   */
  findByRole(role: UserRole): Effect.Effect<User[], DatabaseError, never>;

  /**
   * Find all users with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<User[], DatabaseError, never>;

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

/**
 * UserRepository Context.Tag for Effect dependency injection
 */
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
