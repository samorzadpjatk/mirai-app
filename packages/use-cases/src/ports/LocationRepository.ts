import type { Location, SharingUserInfo } from "@mirai-app/domain";
import type { LocationId } from "@mirai-app/domain";

/**
 * LocationRepository Port
 *
 * This interface defines what operations the application needs
 * from any location repository implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleLocationRepository: Uses Drizzle ORM
 * - InMemoryLocationRepository: For testing
 */
export interface LocationRepository {
  /**
   * Create a new location
   */
  create(location: Location): Promise<Location>;

  /**
   * Find location by ID
   * @returns Location or null if not found
   */
  findById(id: LocationId): Promise<Location | null>;

  /**
   * Find location by user ID
   * @returns Location or null if not found
   */
  findByUserId(userId: string): Promise<Location | null>;

  /**
   * Find all locations with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<Location[]>;

  /**
   * Find locations for users that are sharing with a specific user
   */
  findSharingWithUser(userId: string): Promise<Location[]>;

  /**
   * Find locations by user IDs
   */
  findByUserIds(userIds: string[]): Promise<Location[]>;

  /**
   * Update location (upsert pattern for user locations)
   */
  save(location: Location): Promise<Location>;

  /**
   * Delete location
   */
  delete(id: LocationId): Promise<void>;

  /**
   * Delete location by user ID
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Check if location exists for user
   */
  existsForUser(userId: string): Promise<boolean>;
}
