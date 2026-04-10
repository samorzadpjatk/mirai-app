import type { Location, SharingUserInfo } from "@mirai-app/domain";
import type { LocationId } from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Location Repository for Testing
 *
 * Implements LocationRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryLocationRepository();
 *
 * // Seed with test data
 * const location = Location.create({
 *   userId: "user-123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   isSharingLocation: true,
 * })._unsafeUnwrap();
 *
 * await repo.create(location);
 *
 * const found = await repo.findById(location.id);
 * expect(found).not.toBeNull();
 *
 * // Find by user ID
 * const userLocation = await repo.findByUserId("user-123");
 * expect(userLocation?.latitude).toBe(52.2297);
 *
 * // Find locations sharing with a user
 * const sharing = await repo.findSharingWithUser("viewer-456");
 * expect(sharing).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryLocationRepository
  extends InMemoryRepository<Location>
  implements LocationRepository
{
  /**
   * Create a new location in storage.
   * @param location - The location entity to store
   * @returns Promise resolving to the stored location
   */
  async create(location: Location): Promise<Location> {
    return this.createGeneric(location);
  }

  /**
   * Find a location by its unique identifier.
   * @param id - The LocationId to search for
   * @returns Promise resolving to the location or null if not found
   */
  async findById(id: LocationId): Promise<Location | null> {
    return this.findByIdGeneric(id as string);
  }

  /**
   * Find a location by the associated user ID.
   * Each user should have at most one location record.
   * @param userId - The user ID to search for
   * @returns Promise resolving to the location or null if not found
   */
  async findByUserId(userId: string): Promise<Location | null> {
    return (
      this.getAllItems().find((location) => location.userId === userId) ?? null
    );
  }

  /**
   * Find all locations with optional pagination.
   * @param options - Optional pagination parameters (limit and offset)
   * @returns Promise resolving to an array of locations
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Location[]> {
    return this.findAllGeneric(options);
  }

  /**
   * Find locations that are sharing with a specific user.
   * Returns all locations where the user appears in the usersToShareWith list.
   * @param userId - The user ID to check for in sharing lists
   * @returns Promise resolving to an array of locations sharing with the user
   */
  async findSharingWithUser(userId: string): Promise<Location[]> {
    return this.getAllItems().filter((location) =>
      location.usersToShareWith.some(
        (user: SharingUserInfo) => user.id === userId,
      ),
    );
  }

  /**
   * Find locations for multiple users by their IDs.
   * @param userIds - Array of user IDs to search for
   * @returns Promise resolving to an array of locations belonging to the specified users
   */
  async findByUserIds(userIds: string[]): Promise<Location[]> {
    const userIdSet = new Set(userIds);
    return this.getAllItems().filter((location) =>
      userIdSet.has(location.userId),
    );
  }

  /**
   * Save (upsert) a location to storage.
   * If the location exists, it will be updated; otherwise, it will be created.
   * This is the primary method for updating user locations.
   * @param location - The location entity to save
   * @returns Promise resolving to the saved location
   */
  async save(location: Location): Promise<Location> {
    if (this.storage.has(location.id as string)) {
      return this.updateGeneric(location);
    }
    return this.createGeneric(location);
  }

  /**
   * Delete a location by its ID.
   * @param id - The LocationId of the location to delete
   * @returns Promise that resolves when deletion is complete
   */
  async delete(id: LocationId): Promise<void> {
    return this.deleteGeneric(id as string);
  }

  /**
   * Delete a location by its associated user ID.
   * Useful when cleaning up user data.
   * @param userId - The user ID whose location should be deleted
   * @returns Promise that resolves when deletion is complete
   */
  async deleteByUserId(userId: string): Promise<void> {
    const location = await this.findByUserId(userId);
    if (location) {
      await this.deleteGeneric(location.id as string);
    }
  }

  /**
   * Check if a location exists for a specific user.
   * @param userId - The user ID to check
   * @returns Promise resolving to true if the user has a location, false otherwise
   */
  async existsForUser(userId: string): Promise<boolean> {
    return this.getAllItems().some((location) => location.userId === userId);
  }
}
