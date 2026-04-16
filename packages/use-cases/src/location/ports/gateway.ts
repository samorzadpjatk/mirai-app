import type { LocationId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { LocationDTO, LocationPaginatedResult } from "../dto";
import type { DatabaseError } from "./errors";

/**
 * LocationGateway Port
 *
 * This interface defines what operations the application needs
 * from any location gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleLocationGateway: Uses Drizzle ORM
 * - InMemoryLocationGateway: For testing
 */
export interface LocationGateway {
  /**
   * Create a new location
   */
  create(
    location: LocationDTO,
  ): Effect.Effect<LocationDTO, DatabaseError, never>;

  /**
   * Find location by ID
   * @returns LocationDTO or null if not found
   */
  findById(
    id: LocationId,
  ): Effect.Effect<LocationDTO | null, DatabaseError, never>;

  /**
   * Find location by user ID
   * @returns LocationDTO or null if not found
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<LocationDTO | null, DatabaseError, never>;

  /**
   * Find all locations with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<LocationPaginatedResult, DatabaseError, never>;

  /**
   * Find locations for users that are sharing with a specific user
   */
  findSharingWithUser(
    userId: string,
  ): Effect.Effect<LocationDTO[], DatabaseError, never>;

  /**
   * Find locations by user IDs
   */
  findByUserIds(
    userIds: string[],
  ): Effect.Effect<LocationDTO[], DatabaseError, never>;

  /**
   * Update location (upsert pattern for user locations)
   */
  save(location: LocationDTO): Effect.Effect<LocationDTO, DatabaseError, never>;

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
 * LocationGateway Context.Tag for Effect dependency injection
 */
export class LocationGatewayTag extends Context.Tag("LocationGateway")<
  LocationGatewayTag,
  LocationGateway
>() {}
