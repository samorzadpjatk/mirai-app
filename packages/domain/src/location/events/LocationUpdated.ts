import type { IDomainEvent } from "../../shared/events";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Validation error for invalid coordinates
 */
export class InvalidCoordinatesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCoordinatesError";
  }
}

/**
 * LocationUpdated - Domain event fired when a user updates their location
 *
 * This event is published to the EventBus when a user's location changes.
 * The event includes an embedded sharing list to enable efficient fan-out
 * to friends without additional database queries during event handling.
 *
 * The EventBus applies a 1-second throttle with replace-latest strategy:
 * if multiple updates arrive for the same user within 1 second, only the
 * latest coordinates are published.
 *
 * Coordinate validation:
 * - Latitude: -90 to 90 (decimal degrees)
 * - Longitude: -180 to 180 (decimal degrees)
 * - Accuracy: non-negative number or null
 *
 * @example
 * ```typescript
 * const event = new LocationUpdated(
 *   userId,           // aggregateId (user who updated location)
 *   52.5200,          // latitude (Berlin)
 *   13.4050,          // longitude
 *   10.5,             // accuracy in meters
 *   new Date(),       // occurredAt
 *   [friendId1, friendId2], // sharing list
 * );
 * ```
 */
export class LocationUpdated implements IDomainEvent {
  readonly _tag = "LocationUpdated";
  readonly version = 1;

  /**
   * Unique identifier for this event instance (for deduplication)
   */
  readonly eventId: string;

  /**
   * The user who updated their location (aggregate root identifier)
   */
  readonly userId: UserId;

  /**
   * Latitude coordinate in decimal degrees (-90 to 90)
   */
  readonly latitude: number;

  /**
   * Longitude coordinate in decimal degrees (-180 to 180)
   */
  readonly longitude: number;

  /**
   * GPS accuracy in meters (null if unavailable)
   */
  readonly accuracy: number | null;

  /**
   * When the location update occurred (IDomainEvent requirement)
   */
  readonly occurredAt: Date;

  /**
   * List of friend IDs who should receive this location update
   */
  readonly sharingList: readonly UserId[];

  /**
   * Aggregate ID for IDomainEvent (returns userId as string)
   */
  get aggregateId(): string {
    return this.userId;
  }

  constructor(
    eventId: string,
    userId: UserId,
    latitude: number,
    longitude: number,
    accuracy: number | null,
    occurredAt: Date,
    sharingList: readonly UserId[],
  ) {
    // Validate latitude: -90 to 90
    if (latitude < -90 || latitude > 90) {
      throw new InvalidCoordinatesError(
        `Latitude must be between -90 and 90, got ${latitude}`,
      );
    }

    // Validate longitude: -180 to 180
    if (longitude < -180 || longitude > 180) {
      throw new InvalidCoordinatesError(
        `Longitude must be between -180 and 180, got ${longitude}`,
      );
    }

    // Validate accuracy: non-negative or null
    if (accuracy !== null && accuracy < 0) {
      throw new InvalidCoordinatesError(
        `Accuracy must be non-negative or null, got ${accuracy}`,
      );
    }

    this.eventId = eventId;
    this.userId = userId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy;
    this.occurredAt = occurredAt;
    this.sharingList = sharingList;
  }
}
