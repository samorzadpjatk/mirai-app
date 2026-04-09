import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * TripSponsor entity - represents a sponsor supporting a specific trip
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class TripSponsor {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly sponsorId: string,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a new TripSponsor
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    sponsorId: string;
    createdAt?: Date;
  }): Result<TripSponsor, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate sponsorId
    if (!props.sponsorId || props.sponsorId.trim() === "") {
      return err("sponsorId is required");
    }

    // Check that tripId and sponsorId are not the same
    if (props.tripId.trim() === props.sponsorId.trim()) {
      return err("tripId and sponsorId must be different");
    }

    const now = new Date();

    return ok(
      new TripSponsor(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.sponsorId.trim(),
        props.createdAt ?? now,
      ),
    );
  }

  /**
   * Get unique composite identifier
   */
  getCompositeId(): string {
    return `${this.tripId}:${this.sponsorId}`;
  }

  /**
   * Check if this TripSponsor matches given trip and sponsor
   */
  matches(tripId: string, sponsorId: string): boolean {
    return this.tripId === tripId && this.sponsorId === sponsorId;
  }

  /**
   * Check if this TripSponsor is for a specific trip
   */
  isForTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Check if this TripSponsor is for a specific sponsor
   */
  isForSponsor(sponsorId: string): boolean {
    return this.sponsorId === sponsorId;
  }
}
