import type { TripId, Connection, DatabaseError } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { TripDTO, TripPaginatedResult } from "../dto";

/**
 * Cursor data for trip pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface TripCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for trip connection pagination
 */
export interface TripConnectionArgs {
  first?: number;
  after?: TripCursorData | null;
}

/**
 * TripGateway Port
 *
 * This interface defines what operations the application needs
 * from any trip gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleTripGateway: Uses Drizzle ORM
 * - InMemoryTripGateway: For testing
 */
export interface TripGateway {
  /**
   * Create a new trip
   */
  create(trip: TripDTO): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Find trip by ID
   * @returns TripDTO or null if not found
   */
  findById(id: TripId): Effect.Effect<TripDTO | null, DatabaseError, never>;

  /**
   * Find all trips with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findAllConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Find trips by status with cursor-based pagination
   */
  findByStatusConnection(
    status: string,
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Find active trips with cursor-based pagination
   */
  findActiveConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Update trip
   */
  update(trip: TripDTO): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Update trip status
   */
  updateStatus(
    id: TripId,
    status: string,
  ): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Delete trip
   */
  delete(id: TripId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if trip exists
   */
  exists(id: TripId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count trips by status
   */
  countByStatus(status: string): Effect.Effect<number, DatabaseError, never>;
}

/**
 * TripGateway Context.Tag for Effect dependency injection
 */
export class TripGatewayTag extends Context.Tag("TripGateway")<
  TripGatewayTag,
  TripGateway
>() {}

/**
 * Result of checking if a user is a group leader
 */
export interface GroupLeaderCheckResult {
  isLeader: boolean;
  groupId?: string;
  groupName?: string;
  coins?: number;
}

/**
 * TripAccessChecker service interface
 *
 * Provides access control checks for trips and users.
 */
export interface TripAccessChecker {
  /**
   * Check if a user is staff (admin or moderator)
   */
  isStaff(userId: string): Effect.Effect<boolean, Error, never>;

  /**
   * Check if a user is a group leader in a trip
   */
  isGroupLeader(
    userId: string,
    tripId: string,
  ): Effect.Effect<GroupLeaderCheckResult, Error, never>;

  /**
   * Check if a trip has ended
   */
  hasTripEnded(tripId: string): Effect.Effect<boolean, Error, never>;
}

/**
 * TripAccessCheckerTag Context.Tag for Effect dependency injection
 */
export class TripAccessCheckerTag extends Context.Tag("TripAccessChecker")<
  TripAccessCheckerTag,
  TripAccessChecker
>() {}

/**
 * GroupCoinsService interface
 *
 * Manages group coin balances and transactions.
 */
export interface GroupCoinsService {
  /**
   * Get the current coin balance for a group
   */
  getBalance(groupId: string): Effect.Effect<number, Error, never>;

  /**
   * Add coins to a group's balance
   */
  addCoins(
    groupId: string,
    amount: number,
    reason: string,
    updatedById: string,
  ): Effect.Effect<
    {
      id: string;
      groupId: string;
      amount: number;
      type: string;
      reason: string;
      createdById: string;
      createdAt: Date;
    },
    Error,
    never
  >;

  /**
   * Deduct coins from a group's balance
   */
  deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    updatedById: string,
  ): Effect.Effect<void, Error, never>;
}

/**
 * GroupCoinsServiceTag Context.Tag for Effect dependency injection
 */
export class GroupCoinsServiceTag extends Context.Tag("GroupCoinsService")<
  GroupCoinsServiceTag,
  GroupCoinsService
>() {}
