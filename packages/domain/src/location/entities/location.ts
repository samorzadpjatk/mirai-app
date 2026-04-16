import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { validate } from "../../system/utils/entity-validation";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Location entity - represents a user's location in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Location {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly timestamp: Date,
    public readonly isSharingLocation: boolean,
    public readonly accuracy: number | null,
    public readonly altitude: number | null,
    public readonly altitudeAccuracy: number | null,
    public readonly heading: number | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly speed: number | null,
    public readonly lastInactivityNotification: Date | null,
  ) {}

  /**
   * Factory method to create a new Location
   * Validates all input data
   */
  static create(props: {
    id?: string;
    userId: string;
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
    return Effect.gen(function* () {
      // Validate userId
      const userId = yield* validate.id(props.userId, "userId");

      // Validate coordinates if both are provided
      const latitude = props.latitude ?? null;
      const longitude = props.longitude ?? null;

      if (latitude !== null && (latitude < -90 || latitude > 90)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "latitude must be between -90 and 90",
            field: "latitude",
          }),
        );
      }

      if (longitude !== null && (longitude < -180 || longitude > 180)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "longitude must be between -180 and 180",
            field: "longitude",
          }),
        );
      }

      // Validate accuracy if provided
      const accuracy = props.accuracy ?? null;
      if (accuracy !== null && accuracy < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "accuracy must be non-negative",
            field: "accuracy",
          }),
        );
      }

      // Validate altitude accuracy if provided
      const altitudeAccuracy = props.altitudeAccuracy ?? null;
      if (altitudeAccuracy !== null && altitudeAccuracy < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "altitudeAccuracy must be non-negative",
            field: "altitudeAccuracy",
          }),
        );
      }

      // Validate heading if provided
      const heading = props.heading ?? null;
      if (heading !== null && (heading < 0 || heading >= 360)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "heading must be between 0 and 360",
            field: "heading",
          }),
        );
      }

      // Validate speed if provided
      const speed = props.speed ?? null;
      if (speed !== null && speed < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "speed must be non-negative",
            field: "speed",
          }),
        );
      }

      const ts = timestamps();

      return new Location(
        props.id ?? crypto.randomUUID(),
        userId,
        props.timestamp ?? ts.createdAt,
        props.isSharingLocation ?? false,
        accuracy,
        props.altitude ?? null,
        altitudeAccuracy,
        heading,
        latitude,
        longitude,
        speed,
        props.lastInactivityNotification ?? null,
      );
    });
  }

  /**
   * Update location coordinates
   */
  updateCoordinates(props: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp?: Date;
  }): Effect.Effect<Location, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate latitude
      if (props.latitude < -90 || props.latitude > 90) {
        return yield* Effect.fail(
          new ValidationError({
            message: "latitude must be between -90 and 90",
            field: "latitude",
          }),
        );
      }

      // Validate longitude
      if (props.longitude < -180 || props.longitude > 180) {
        return yield* Effect.fail(
          new ValidationError({
            message: "longitude must be between -180 and 180",
            field: "longitude",
          }),
        );
      }

      // Validate optional fields
      let accuracy: number | null = props.accuracy ?? null;
      if (accuracy !== null && accuracy < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "accuracy must be non-negative",
            field: "accuracy",
          }),
        );
      }

      let altitudeAccuracy: number | null = props.altitudeAccuracy ?? null;
      if (altitudeAccuracy !== null && altitudeAccuracy < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "altitudeAccuracy must be non-negative",
            field: "altitudeAccuracy",
          }),
        );
      }

      let heading: number | null = props.heading ?? null;
      if (heading !== null && (heading < 0 || heading >= 360)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "heading must be between 0 and 360",
            field: "heading",
          }),
        );
      }

      let speed: number | null = props.speed ?? null;
      if (speed !== null && speed < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "speed must be non-negative",
            field: "speed",
          }),
        );
      }

      return updateEntity(
        self,
        {
          latitude: props.latitude,
          longitude: props.longitude,
          accuracy,
          altitude: props.altitude ?? null,
          altitudeAccuracy,
          heading,
          speed,
          timestamp: props.timestamp ?? new Date(),
        },
        Location,
      );
    });
  }

  /**
   * Enable location sharing
   */
  enableSharing(): Location {
    return updateEntity(
      this,
      {
        isSharingLocation: true,
      },
      Location,
    );
  }

  /**
   * Disable location sharing
   */
  disableSharing(): Location {
    return updateEntity(
      this,
      {
        isSharingLocation: false,
      },
      Location,
    );
  }

  /**
   * Update last inactivity notification timestamp
   */
  updateInactivityNotification(timestamp: Date): Location {
    return updateEntity(
      this,
      {
        lastInactivityNotification: timestamp,
      },
      Location,
    );
  }

  /**
   * Check if location sharing is enabled
   */
  isSharing(): boolean {
    return this.isSharingLocation;
  }

  /**
   * Check if location has valid coordinates
   */
  hasValidCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Get coordinates as a tuple
   */
  getCoordinates(): [number, number] | null {
    if (this.latitude !== null && this.longitude !== null) {
      return [this.latitude, this.longitude];
    }
    return null;
  }

  /**
   * Calculate distance to another location in meters (Haversine formula)
   */
  distanceTo(other: Location): number | null {
    const coords1 = this.getCoordinates();
    const coords2 = other.getCoordinates();

    if (!coords1 || !coords2) {
      return null;
    }

    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if location is stale (older than specified minutes)
   */
  isStale(minutes: number, now: Date = new Date()): boolean {
    const staleThreshold = now.getTime() - minutes * 60 * 1000;
    return this.timestamp.getTime() < staleThreshold;
  }

  /**
   * Get age of location in minutes
   */
  getAgeInMinutes(now: Date = new Date()): number {
    return Math.floor((now.getTime() - this.timestamp.getTime()) / (1000 * 60));
  }

  /**
   * Check if belongs to user
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }
}
