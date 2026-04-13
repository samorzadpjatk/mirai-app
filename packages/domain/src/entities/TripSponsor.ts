import { Effect } from "effect";
import { ValidationError } from "../errors/effect-errors";

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
  }): Effect.Effect<TripSponsor, ValidationError, never> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "tripId is required",
          field: "tripId",
        }),
      );
    }

    // Validate sponsorId
    if (!props.sponsorId || props.sponsorId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "sponsorId is required",
          field: "sponsorId",
        }),
      );
    }

    // Check that tripId and sponsorId are not the same
    if (props.tripId.trim() === props.sponsorId.trim()) {
      return Effect.fail(
        new ValidationError({
          message: "tripId and sponsorId must be different",
          field: "tripId",
        }),
      );
    }

    const now = new Date();

    return Effect.succeed(
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
