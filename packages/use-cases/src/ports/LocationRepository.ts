import type { Location, SharingUserInfo, LocationId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

/**
 * LocationRepository Port
 *
 * This interface defines what operations the application needs
 * from any location repository implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 *
 * Implementations (in adapters layer):
 * - DrizzleLocationRepository: Uses Drizzle ORM
 * - InMemoryLocationRepository: For testing
 */
export interface LocationRepository {
  /**
   * Create a new location
   */
  create(location: Location): Effect.Effect<Location, DatabaseError, never>;

  /**
   * Find location by ID
   * @returns Location or null if not found
   */
  findById(
    id: LocationId,
  ): Effect.Effect<Location | null, DatabaseError, never>;

  /**
   * Find location by user ID
   * @returns Location or null if not found
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<Location | null, DatabaseError, never>;

  /**
   * Find all locations with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Location[], DatabaseError, never>;

  /**
   * Find locations for users that are sharing with a specific user
   */
  findSharingWithUser(
    userId: string,
  ): Effect.Effect<Location[], DatabaseError, never>;

  /**
   * Find locations by user IDs
   */
  findByUserIds(
    userIds: string[],
  ): Effect.Effect<Location[], DatabaseError, never>;

  /**
   * Update location (upsert pattern for user locations)
   */
  save(location: Location): Effect.Effect<Location, DatabaseError, never>;

  /**
   * Delete location
   */
  delete(id: LocationId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete location by user ID
   */
  deleteByUserId(userId: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if location exists for user
   */
  existsForUser(userId: string): Effect.Effect<boolean, DatabaseError, never>;
}

/**
 * LocationRepository Context.Tag for Effect dependency injection
 */
export class LocationRepositoryTag extends Context.Tag("LocationRepository")<
  LocationRepositoryTag,
  LocationRepository
>() {}
