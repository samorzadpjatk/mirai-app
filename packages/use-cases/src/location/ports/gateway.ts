import type { LocationId, Connection, DatabaseError } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type {
  LocationDTO,
  LocationPaginatedResult,
  LocationSharingDTO,
} from "../dto";

/**
 * Cursor data for location pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface LocationCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for location connection pagination
 */
export interface LocationConnectionArgs {
  first?: number;
  after?: LocationCursorData | null;
}

/**
 * Cursor data for location sharing request pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface LocationSharingRequestCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for location sharing request connection pagination
 */
export interface LocationSharingRequestConnectionArgs {
  first?: number;
  after?: LocationSharingRequestCursorData | null;
}

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
   * Uses cursor-based pagination per Relay Cursor Connections Specification
   */
  findSharingWithUserConnection(
    userId: string,
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, DatabaseError, never>;

  /**
   * Find locations by user IDs with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByUserIdsConnection(
    userIds: string[],
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, DatabaseError, never>;

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

  /**
   * Find location sharing requests sent by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, DatabaseError, never>;

  /**
   * Find location sharing requests received by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findReceivedSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, DatabaseError, never>;
}

/**
 * LocationGateway Context.Tag for Effect dependency injection
 */
export class LocationGatewayTag extends Context.Tag("LocationGateway")<
  LocationGatewayTag,
  LocationGateway
>() {}
