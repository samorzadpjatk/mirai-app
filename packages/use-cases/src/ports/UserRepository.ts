import type { User, UserRole } from "@repo/domain";

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
  create(user: User): Promise<User>;

  /**
   * Find user by ID
   * @returns User or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by auth user ID (from Supabase Auth)
   * @returns User or null if not found
   */
  findByAuthUserId(authUserId: string): Promise<User | null>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * Find all users with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<User[]>;

  /**
   * Update user
   */
  update(user: User): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user exists by auth user ID
   */
  existsByAuthUserId(authUserId: string): Promise<boolean>;
}
