import type { User, UserRole } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * UserRepository Port
 *
 * This interface defines what operations the application needs
 * from any user repository implementation.
 *
 * Implementations (in adapters layer):
 * - PrismaUserRepository: Uses Prisma ORM
 * - InMemoryUserRepository: For testing
 */
export interface UserRepository {
  /**
   * Create a new user
   */
  create(user: User): Effect.Effect<User, never, never>;

  /**
   * Find user by ID
   * @returns User or null if not found
   */
  findById(id: string): Effect.Effect<User | null, never, never>;

  /**
   * Find user by auth user ID (from Supabase Auth)
   * @returns User or null if not found
   */
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, never, never>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Effect.Effect<User[], never, never>;

  /**
   * Find all users with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<User[], never, never>;

  /**
   * Update user
   */
  update(user: User): Effect.Effect<User, never, never>;

  /**
   * Delete user
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Check if user exists by auth user ID
   */
  existsByAuthUserId(authUserId: string): Effect.Effect<boolean, never, never>;
}

/**
 * UserRepository Context.Tag for Effect dependency injection
 */
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  {
    create: (user: User) => Effect.Effect<User, never, never>;
    findById: (id: string) => Effect.Effect<User | null, never, never>;
    findByAuthUserId: (
      authUserId: string,
    ) => Effect.Effect<User | null, never, never>;
    findByRole: (role: UserRole) => Effect.Effect<User[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<User[], never, never>;
    update: (user: User) => Effect.Effect<User, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    existsByAuthUserId: (
      authUserId: string,
    ) => Effect.Effect<boolean, never, never>;
  }
>() {}
