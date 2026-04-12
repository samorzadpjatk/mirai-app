import type { Location, SharingUserInfo } from "@mirai-app/domain";
import type { LocationId } from "@mirai-app/domain";
import { Context, Effect } from "effect";

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

/**
 * LocationRepository Context.Tag for Effect dependency injection
 */
export class LocationRepositoryTag extends Context.Tag("LocationRepository")<
  LocationRepositoryTag,
  {
    create: (location: Location) => Effect.Effect<Location, never, never>;
    findById: (id: LocationId) => Effect.Effect<Location | null, never, never>;
    findByUserId: (
      userId: string,
    ) => Effect.Effect<Location | null, never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Location[], never, never>;
    findSharingWithUser: (
      userId: string,
    ) => Effect.Effect<Location[], never, never>;
    findByUserIds: (
      userIds: string[],
    ) => Effect.Effect<Location[], never, never>;
    save: (location: Location) => Effect.Effect<Location, never, never>;
    delete: (id: LocationId) => Effect.Effect<void, never, never>;
    deleteByUserId: (userId: string) => Effect.Effect<void, never, never>;
    existsForUser: (userId: string) => Effect.Effect<boolean, never, never>;
  }
>() {}
