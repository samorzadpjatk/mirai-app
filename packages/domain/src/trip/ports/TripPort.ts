import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Trip } from "../entities/Trip";
import type { TripId } from "../value-objects/TripId";

/**
 * Trip Resource interface
 */
export interface TripResource {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  iconName: string | null;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance Step interface
 */
export interface InsuranceStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
}

/**
 * Trip Insurance interface
 */
export interface TripInsurance {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  provider: string | null;
  policyNumber: string | null;
  steps: InsuranceStep[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trip Repository Port
 *
 * Defines the interface for trip persistence operations.
 */
export interface ITripPort {
  /**
   * Find trip by ID
   */
  findById(
    id: TripId,
  ): Effect.Effect<Trip | null, IPortError, never>;

  /**
   * Find trips by user ID
   */
  findByUserId(userId: string): Effect.Effect<Trip[], IPortError, never>;

  /**
   * Find all trips
   */
  findAll(): Effect.Effect<Trip[], IPortError, never>;

  /**
   * Find active trips at a given date
   */
  findActive(atDate: Date): Effect.Effect<Trip[], IPortError, never>;

  /**
   * Find paginated trips for a user
   */
  findPaginated(params: {
    userId: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { trips: Trip[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Create new trip
   */
  create(trip: Trip): Effect.Effect<Trip, IPortError, never>;

  /**
   * Update existing trip
   */
  update(trip: Trip): Effect.Effect<Trip, IPortError, never>;

  /**
   * Delete trip by ID
   */
  delete(id: TripId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if trip exists
   */
  exists(id: TripId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Check if user has access to trip
   */
  hasUserAccess(
    tripId: string,
    userId: string,
  ): Effect.Effect<boolean, IPortError, never>;

  /**
   * Find resources by trip ID
   */
  findResourcesByTripId(
    tripId: string,
  ): Effect.Effect<TripResource[], IPortError, never>;

  /**
   * Find insurance by trip ID
   */
  findInsuranceByTripId(
    tripId: string,
  ): Effect.Effect<TripInsurance | null, IPortError, never>;
}
