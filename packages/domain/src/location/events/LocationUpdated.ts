import { Data } from "effect";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Coordinates value object
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * LocationUpdatedEventPayload - All data needed for location update events
 *
 * This payload includes an embedded sharing list to enable efficient fan-out
 * to friends without additional database queries during event handling.
 */
export interface LocationUpdatedEventPayload {
  /** Unique identifier for this event instance (for deduplication) */
  readonly eventId: string;

  /** User who updated location (branded type) */
  readonly userId: UserId;

  /** Latitude and longitude coordinates */
  readonly coordinates: Coordinates;

  /** GPS accuracy in meters (optional) */
  readonly accuracy?: number;

  /** When the location update occurred */
  readonly timestamp: Date;

  /** Friend IDs to fan out to */
  readonly sharingList: readonly UserId[];
}

/**
 * InvalidCoordinatesError - Validation error for invalid coordinates
 */
export class InvalidCoordinatesError extends Data.TaggedError("InvalidCoordinatesError")<{
  field: "latitude" | "longitude" | "accuracy";
  value: number;
  reason: string;
}> {}

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
 * - Accuracy: non-negative number or undefined
 *
 * @example
 * ```typescript
 * const event = new LocationUpdated({
 *   eventId: "evt-123",          // UUID for deduplication
 *   userId: userId,              // branded UserId
 *   coordinates: {
 *     latitude: 52.5200,       // Berlin
 *     longitude: 13.4050
 *   },
 *   accuracy: 10.5,              // GPS accuracy in meters
 *   timestamp: new Date(),       // When update occurred
 *   sharingList: [friendId1, friendId2]  // Users to notify
 * });
 * ```
 */
export class LocationUpdated extends Data.TaggedClass("LocationUpdated")<LocationUpdatedEventPayload> {
  /**
   * Validates coordinates before construction
   */
  constructor(payload: LocationUpdatedEventPayload) {
    // Validate latitude: -90 to 90
    if (
      payload.coordinates.latitude < -90 ||
      payload.coordinates.latitude > 90
    ) {
      throw new InvalidCoordinatesError({
        field: "latitude",
        value: payload.coordinates.latitude,
        reason: "Latitude must be between -90 and 90",
      });
    }

    // Validate longitude: -180 to 180
    if (
      payload.coordinates.longitude < -180 ||
      payload.coordinates.longitude > 180
    ) {
      throw new InvalidCoordinatesError({
        field: "longitude",
        value: payload.coordinates.longitude,
        reason: "Longitude must be between -180 and 180",
      });
    }

    // Validate accuracy: non-negative or undefined
    if (payload.accuracy !== undefined && payload.accuracy < 0) {
      throw new InvalidCoordinatesError({
        field: "accuracy",
        value: payload.accuracy,
        reason: "Accuracy must be non-negative",
      });
    }

    super(payload);
  }

  /**
   * Aggregate ID (user who updated) for IDomainEvent compatibility
   */
  get aggregateId(): string {
    return this.userId;
  }

  /**
   * When the event occurred (for IDomainEvent compatibility)
   */
  get occurredAt(): Date {
    return this.timestamp;
  }

  /**
   * Schema version for backward compatibility
   */
  readonly version = 1;
}
