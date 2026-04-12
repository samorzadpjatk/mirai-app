import { Effect } from "effect";
import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";
import type { LocationId } from "../value-objects/LocationId";

/**
 * Location accuracy levels
 */
export enum LocationAccuracy {
  HIGH = "HIGH", // < 10 meters
  MEDIUM = "MEDIUM", // 10-50 meters
  LOW = "LOW", // > 50 meters
  UNKNOWN = "UNKNOWN",
}

/**
 * Validation constants
 */
const VALIDATION = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
  accuracy: { high: 10, medium: 50 },
};

/**
 * User info for location sharing
 */
export interface SharingUserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  hasAvatar?: boolean | null;
}

/**
 * Location entity - represents a user's geographical location
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 *
 * Based on Expo Location Object: https://docs.expo.dev/versions/latest/sdk/location/#locationobject
 */
export class Location {
  private constructor(
    public readonly id: LocationId,
    public readonly userId: string,
    public latitude: number | null,
    public longitude: number | null,
    public accuracy: number | null,
    public altitude: number | null,
    public altitudeAccuracy: number | null,
    public heading: number | null,
    public speed: number | null,
    public sharingLocation: boolean,
    public timestamp: Date,
    public lastInactivityNotification: Date | null,
    public usersToShareWith: SharingUserInfo[],
  ) {}

  /**
   * Factory method to create a new Location
   *
   * Returns Effect<Location, ValidationError, never> - pure synchronous effect
   */
  static create(props: {
    id?: LocationId;
    userId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    isSharingLocation?: boolean;
    timestamp?: Date;
    lastInactivityNotification?: Date | null;
    usersToShareWith?: SharingUserInfo[];
  }): Effect.Effect<Location, ValidationError, never> {
    // Validate userId
    const userId = validate.id(props.userId, "userId");
    if (isError(userId)) {
      return Effect.fail(
        new ValidationError({
          message: userId.error.message,
          field: "userId",
        }),
      );
    }

    // Validate latitude if provided
    if (props.latitude !== undefined && props.latitude !== null) {
      const validated = validate.number(props.latitude, "latitude", {
        required: true,
        min: VALIDATION.latitude.min,
        max: VALIDATION.latitude.max,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "latitude",
          }),
        );
      }
    }

    // Validate longitude if provided
    if (props.longitude !== undefined && props.longitude !== null) {
      const validated = validate.number(props.longitude, "longitude", {
        required: true,
        min: VALIDATION.longitude.min,
        max: VALIDATION.longitude.max,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "longitude",
          }),
        );
      }
    }

    // Validate accuracy if provided
    if (props.accuracy !== undefined && props.accuracy !== null) {
      const validated = validate.number(props.accuracy, "accuracy", {
        required: true,
        min: 0,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "accuracy",
          }),
        );
      }
    }

    // Validate speed if provided
    if (props.speed !== undefined && props.speed !== null) {
      const validated = validate.number(props.speed, "speed", {
        required: true,
        min: 0,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "speed",
          }),
        );
      }
    }

    // Validate heading if provided (0-360 degrees)
    if (props.heading !== undefined && props.heading !== null) {
      const validated = validate.number(props.heading, "heading", {
        required: true,
        min: 0,
        max: 360,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "heading",
          }),
        );
      }
    }

    // Validate usersToShareWith - prevent self-sharing
    const shareList = props.usersToShareWith ?? [];
    if (shareList.some((u) => u.id === props.userId)) {
      return Effect.fail(
        new ValidationError({
          message: "Cannot share location with yourself",
          field: "usersToShareWith",
        }),
      );
    }

    return Effect.succeed(
      new Location(
        props.id ?? (crypto.randomUUID() as LocationId),
        userId.value,
        props.latitude ?? null,
        props.longitude ?? null,
        props.accuracy ?? null,
        props.altitude ?? null,
        props.altitudeAccuracy ?? null,
        props.heading ?? null,
        props.speed ?? null,
        props.isSharingLocation ?? false,
        props.timestamp ?? new Date(),
        props.lastInactivityNotification ?? null,
        shareList,
      ),
    );
  }

  /**
   * Factory method to reconstitute a Location from persistence
   */
  static reconstitute(data: {
    id: LocationId;
    userId: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    isSharingLocation: boolean;
    timestamp: Date;
    lastInactivityNotification: Date | null;
    usersToShareWith: SharingUserInfo[];
  }): Location {
    return new Location(
      data.id,
      data.userId,
      data.latitude,
      data.longitude,
      data.accuracy,
      data.altitude,
      data.altitudeAccuracy,
      data.heading,
      data.speed,
      data.isSharingLocation,
      data.timestamp,
      data.lastInactivityNotification,
      data.usersToShareWith,
    );
  }

  /**
   * Update coordinates and related data
   *
   * Returns Effect<Location, ValidationError, never>
   */
  updateCoordinates(props: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    speed?: number | null;
    heading?: number | null;
  }): Effect.Effect<Location, ValidationError, never> {
    const updates: Partial<Location> = {};

    // Validate and update latitude if provided
    if (props.latitude !== undefined) {
      if (props.latitude !== null) {
        const validated = validate.number(props.latitude, "latitude", {
          required: true,
          min: VALIDATION.latitude.min,
          max: VALIDATION.latitude.max,
        });
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "latitude",
            }),
          );
        }
      }
      updates.latitude = props.latitude;
    }

    // Validate and update longitude if provided
    if (props.longitude !== undefined) {
      if (props.longitude !== null) {
        const validated = validate.number(props.longitude, "longitude", {
          required: true,
          min: VALIDATION.longitude.min,
          max: VALIDATION.longitude.max,
        });
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "longitude",
            }),
          );
        }
      }
      updates.longitude = props.longitude;
    }

    // Validate speed if provided
    if (props.speed !== undefined && props.speed !== null) {
      const validated = validate.number(props.speed, "speed", {
        required: true,
        min: 0,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "speed",
          }),
        );
      }
      updates.speed = props.speed;
    } else if (props.speed === null) {
      updates.speed = null;
    }

    // Validate heading if provided
    if (props.heading !== undefined && props.heading !== null) {
      const validated = validate.number(props.heading, "heading", {
        required: true,
        min: 0,
        max: 360,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "heading",
          }),
        );
      }
      updates.heading = props.heading;
    } else if (props.heading === null) {
      updates.heading = null;
    }

    if (props.accuracy !== undefined) updates.accuracy = props.accuracy;
    if (props.altitude !== undefined) updates.altitude = props.altitude;
    updates.timestamp = new Date();

    return Effect.succeed(updateEntity(this, updates, Location));
  }

  /**
   * Start sharing location
   */
  startSharing(): Location {
    return updateEntity(
      this,
      { sharingLocation: true, timestamp: new Date() },
      Location,
    );
  }

  /**
   * Stop sharing location
   */
  stopSharing(): Location {
    return updateEntity(
      this,
      { sharingLocation: false, timestamp: new Date() },
      Location,
    );
  }

  /**
   * Add a user to share location with
   *
   * Returns Effect<Location, ValidationError, never>
   */
  addSharingUser(
    user: SharingUserInfo,
  ): Effect.Effect<Location, ValidationError, never> {
    // Prevent self-sharing
    if (user.id === this.userId) {
      return Effect.fail(
        new ValidationError({
          message: "Cannot share location with yourself",
          field: "user",
        }),
      );
    }

    // Check if already sharing with this user
    if (this.usersToShareWith.some((u) => u.id === user.id)) {
      return Effect.fail(
        new ValidationError({
          message: `Already sharing location with user ${user.id}`,
          field: "user",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          usersToShareWith: [...this.usersToShareWith, user],
          timestamp: new Date(),
        },
        Location,
      ),
    );
  }

  /**
   * Remove a user from sharing list
   */
  removeSharingUser(userId: string): Location {
    return updateEntity(
      this,
      {
        usersToShareWith: this.usersToShareWith.filter((u) => u.id !== userId),
        timestamp: new Date(),
      },
      Location,
    );
  }

  /**
   * Update the entire sharing users list
   *
   * Returns Effect<Location, ValidationError, never>
   */
  updateSharingUsers(
    users: SharingUserInfo[],
  ): Effect.Effect<Location, ValidationError, never> {
    // Prevent self-sharing
    if (users.some((u) => u.id === this.userId)) {
      return Effect.fail(
        new ValidationError({
          message: "Cannot share location with yourself",
          field: "users",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        { usersToShareWith: users, timestamp: new Date() },
        Location,
      ),
    );
  }

  /**
   * Update last inactivity notification timestamp
   */
  updateInactivityNotification(): Location {
    return updateEntity(
      this,
      { lastInactivityNotification: new Date() },
      Location,
    );
  }

  /**
   * Check if location sharing is enabled
   */
  isSharingLocation(): boolean {
    return this.sharingLocation;
  }

  /**
   * Check if location is accurate enough (< 50 meters)
   */
  isAccurate(): boolean {
    return (
      this.accuracy !== null && this.accuracy <= VALIDATION.accuracy.medium
    );
  }

  /**
   * Check if user is moving (speed > 0)
   */
  isMoving(): boolean {
    return this.speed !== null && this.speed > 0;
  }

  /**
   * Check if location has valid coordinates
   */
  hasCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Get accuracy level
   */
  getAccuracyLevel(): LocationAccuracy {
    if (this.accuracy === null) {
      return LocationAccuracy.UNKNOWN;
    }
    if (this.accuracy <= VALIDATION.accuracy.high) {
      return LocationAccuracy.HIGH;
    }
    if (this.accuracy <= VALIDATION.accuracy.medium) {
      return LocationAccuracy.MEDIUM;
    }
    return LocationAccuracy.LOW;
  }

  /**
   * Get coordinates as [lat, lng] tuple
   * Returns null if coordinates are not set
   */
  getCoordinates(): [number, number] | null {
    if (this.latitude === null || this.longitude === null) {
      return null;
    }
    return [this.latitude, this.longitude];
  }

  /**
   * Calculate distance to another location using Haversine formula
   * Returns distance in kilometers, or null if either location has no coordinates
   */
  distanceTo(other: Location): number | null {
    if (!this.hasCoordinates() || !other.hasCoordinates()) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.latitude! - this.latitude!);
    const dLon = this.toRadians(other.longitude! - this.longitude!);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude!)) *
        Math.cos(this.toRadians(other.latitude!)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if this location is within a given radius of coordinates
   * @param latitude - Center point latitude
   * @param longitude - Center point longitude
   * @param radiusKm - Radius in kilometers
   */
  isWithinRadius(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): boolean {
    if (!this.hasCoordinates()) {
      return false;
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      this.latitude!,
      this.longitude!,
    );

    return distance <= radiusKm;
  }

  /**
   * Check if this location can be viewed by a specific user
   */
  canBeViewedBy(viewerUserId: string): boolean {
    // Owner can always view
    if (viewerUserId === this.userId) {
      return true;
    }

    // If not sharing, no one else can view
    if (!this.sharingLocation) {
      return false;
    }

    // Check if viewer is in sharing list
    return this.usersToShareWith.some((u) => u.id === viewerUserId);
  }

  /**
   * Check if sharing with a specific user
   */
  isSharingWith(userId: string): boolean {
    return this.usersToShareWith.some((u) => u.id === userId);
  }

  /**
   * Check if location data is stale (older than threshold)
   * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
   */
  isStale(thresholdMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this.timestamp.getTime() > thresholdMs;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Get location summary
   */
  getSummary(): string {
    if (!this.hasCoordinates()) {
      return "No coordinates available";
    }
    const coords = `${this.latitude!.toFixed(4)}, ${this.longitude!.toFixed(4)}`;
    const accuracy = this.accuracy
      ? `±${this.accuracy.toFixed(0)}m`
      : "unknown accuracy";
    return `${coords} (${accuracy})`;
  }

  /**
   * Convert to Expo-compliant location object format
   */
  toExpoFormat(): {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  } | null {
    if (!this.hasCoordinates()) {
      return null;
    }

    return {
      coords: {
        latitude: this.latitude!,
        longitude: this.longitude!,
        altitude: this.altitude,
        accuracy: this.accuracy,
        altitudeAccuracy: this.altitudeAccuracy,
        heading: this.heading,
        speed: this.speed,
      },
      timestamp: this.timestamp.getTime(),
    };
  }
}

/**
 * Calculate distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace LocationCompat {
  /**
   * @deprecated Use Location.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof Location.create>[0],
  ): Result<Location, ValidationError> {
    const effect = Location.create(props);
    try {
      const location = Effect.runSync(effect);
      return ok(location);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
