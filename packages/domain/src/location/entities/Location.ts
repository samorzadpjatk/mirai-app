import type { LocationId } from "../value-objects/LocationId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Location Domain Entity
 *
 * Represents a user's GPS location with sharing preferences.
 */
export class Location {
  private constructor(
    readonly id: LocationId,
    readonly userId: UserId,
    readonly timestamp: Date,
    readonly isSharingLocation: boolean,
    readonly accuracy: number | null,
    readonly altitude: number | null,
    readonly altitudeAccuracy: number | null,
    readonly heading: number | null,
    readonly latitude: number | null,
    readonly longitude: number | null,
    readonly speed: number | null,
    readonly lastInactivityNotification: Date | null,
  ) {}

  /**
   * Factory method to create a Location entity
   */
  static create(props: {
    id: LocationId;
    userId: UserId;
    timestamp?: Date;
    isSharingLocation?: boolean;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    speed?: number | null;
    lastInactivityNotification?: Date | null;
  }): Effect.Effect<Location, ValidationError, never> {
    // Validate coordinates if both are provided
    if (props.latitude !== null && props.latitude !== undefined) {
      if (props.latitude < -90 || props.latitude > 90) {
        return Effect.fail(
          new ValidationError({
            field: "latitude",
            message: "Latitude must be between -90 and 90",
            value: props.latitude,
          }),
        );
      }
    }

    if (props.longitude !== null && props.longitude !== undefined) {
      if (props.longitude < -180 || props.longitude > 180) {
        return Effect.fail(
          new ValidationError({
            field: "longitude",
            message: "Longitude must be between -180 and 180",
            value: props.longitude,
          }),
        );
      }
    }

    return Effect.succeed(
      new Location(
        props.id,
        props.userId,
        props.timestamp ?? new Date(),
        props.isSharingLocation ?? false,
        props.accuracy ?? null,
        props.altitude ?? null,
        props.altitudeAccuracy ?? null,
        props.heading ?? null,
        props.latitude ?? null,
        props.longitude ?? null,
        props.speed ?? null,
        props.lastInactivityNotification ?? null,
      ),
    );
  }

  /**
   * Check if location has valid coordinates
   */
  hasValidCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Enable location sharing
   */
  enableSharing(): Location {
    return new Location(
      this.id,
      this.userId,
      this.timestamp,
      true,
      this.accuracy,
      this.altitude,
      this.altitudeAccuracy,
      this.heading,
      this.latitude,
      this.longitude,
      this.speed,
      this.lastInactivityNotification,
    );
  }

  /**
   * Disable location sharing
   */
  disableSharing(): Location {
    return new Location(
      this.id,
      this.userId,
      this.timestamp,
      false,
      this.accuracy,
      this.altitude,
      this.altitudeAccuracy,
      this.heading,
      this.latitude,
      this.longitude,
      this.speed,
      this.lastInactivityNotification,
    );
  }

  /**
   * Update location coordinates
   */
  withCoordinates(props: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }): Effect.Effect<Location, ValidationError, never> {
    return Location.create({
      id: this.id,
      userId: this.userId,
      timestamp: new Date(),
      isSharingLocation: this.isSharingLocation,
      accuracy: props.accuracy ?? this.accuracy,
      altitude: props.altitude ?? this.altitude,
      altitudeAccuracy: props.altitudeAccuracy ?? this.altitudeAccuracy,
      heading: props.heading ?? this.heading,
      latitude: props.latitude,
      longitude: props.longitude,
      speed: props.speed ?? this.speed,
      lastInactivityNotification: this.lastInactivityNotification,
    });
  }

  /**
   * Update last inactivity notification timestamp
   */
  withInactivityNotification(timestamp: Date): Location {
    return new Location(
      this.id,
      this.userId,
      this.timestamp,
      this.isSharingLocation,
      this.accuracy,
      this.altitude,
      this.altitudeAccuracy,
      this.heading,
      this.latitude,
      this.longitude,
      this.speed,
      timestamp,
    );
  }
}
