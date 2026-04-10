import {
  Location,
  LocationAccuracy,
  type SharingUserInfo,
} from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/base/repository";
import type {
  locations,
  LocationSelect,
  LocationInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * LocationDrizzleMapper
 *
 * Maps between Drizzle database records and domain Location entities.
 */
export class LocationDrizzleMapper implements DrizzleEntityMapper<
  Location,
  LocationSelect,
  LocationInsert
> {
  /**
   * Convert a Drizzle Location record to a domain Location entity
   */
  toDomain(record: LocationSelect): Location {
    const accuracy = this.mapAccuracyFromValue(record.accuracy);

    const result = Location.create({
      id: record.id,
      userId: record.userId,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      altitude: record.altitude,
      altitudeAccuracy: record.altitudeAccuracy,
      heading: record.heading,
      speed: record.speed,
      isSharingLocation: record.isSharingLocation,
      timestamp: record.timestamp,
      lastInactivityNotification: record.lastInactivityNotification,
      usersToShareWith: [], // Loaded separately via join
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Location from Drizzle: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Location entity to Drizzle insert input
   */
  toDrizzleInsert(location: Location): LocationInsert {
    return {
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      isSharingLocation: location.isSharingLocation,
      timestamp: location.timestamp,
      lastInactivityNotification: location.lastInactivityNotification,
    };
  }

  /**
   * Convert a domain Location entity to Drizzle update input
   */
  toDrizzleUpdate(location: Location): Partial<LocationInsert> {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      isSharingLocation: location.isSharingLocation,
      timestamp: location.timestamp,
      lastInactivityNotification: location.lastInactivityNotification,
    };
  }

  /**
   * Map accuracy value to LocationAccuracy enum
   */
  private mapAccuracyFromValue(accuracy: number | null): LocationAccuracy {
    if (accuracy === null) return LocationAccuracy.UNKNOWN;
    if (accuracy < 10) return LocationAccuracy.HIGH;
    if (accuracy < 50) return LocationAccuracy.MEDIUM;
    return LocationAccuracy.LOW;
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new LocationDrizzleMapper();
}
