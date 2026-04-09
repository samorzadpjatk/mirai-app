import type { Trip, TripStatus } from "@mirai-app/domain";

/**
 * TripRepository Port
 *
 * This interface defines what operations the application needs
 * from any trip repository implementation.
 */
export interface TripRepository {
  /**
   * Create a new trip
   */
  create(trip: Trip): Promise<Trip>;

  /**
   * Find trip by ID
   * @returns Trip or null if not found
   */
  findById(id: string): Promise<Trip | null>;

  /**
   * Find trips by status
   */
  findByStatus(status: TripStatus): Promise<Trip[]>;

  /**
   * Find active trips
   */
  findActive(): Promise<Trip[]>;

  /**
   * Find all trips with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<Trip[]>;

  /**
   * Update trip
   */
  update(trip: Trip): Promise<Trip>;

  /**
   * Update trip status
   */
  updateStatus(id: string, status: TripStatus): Promise<Trip>;

  /**
   * Delete trip
   */
  delete(id: string): Promise<void>;

  /**
   * Check if trip exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count trips by status
   */
  countByStatus(status: TripStatus): Promise<number>;
}
