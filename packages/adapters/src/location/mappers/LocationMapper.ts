import type {
  LocationSelect,
  LocationInsert,
} from "../../infrastructure/drizzle";
import { Location, LocationId, UserId } from "@mirai-app/domain";
import type { ValidationError } from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * Location Mapper
 *
 * Maps between database Location records and domain Location entities.
 */
export class LocationMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbLocation: LocationSelect,
  ): Effect.Effect<Location, ValidationError, never> {
    return Location.create({
      id: LocationId.unsafeCreate(dbLocation.id),
      userId: UserId.unsafeCreate(dbLocation.userId),
      timestamp: dbLocation.timestamp,
      isSharingLocation: dbLocation.isSharingLocation,
      accuracy: dbLocation.accuracy ?? null,
      altitude: dbLocation.altitude ?? null,
      altitudeAccuracy: dbLocation.altitudeAccuracy ?? null,
      heading: dbLocation.heading ?? null,
      latitude: dbLocation.latitude ?? null,
      longitude: dbLocation.longitude ?? null,
      speed: dbLocation.speed ?? null,
      lastInactivityNotification: dbLocation.lastInactivityNotification ?? null,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(location: Location): LocationInsert {
    return {
      id: LocationId.toString(location.id),
      userId: UserId.toString(location.userId),
      timestamp: location.timestamp,
      isSharingLocation: location.isSharingLocation,
      accuracy: location.accuracy ?? undefined,
      altitude: location.altitude ?? undefined,
      altitudeAccuracy: location.altitudeAccuracy ?? undefined,
      heading: location.heading ?? undefined,
      latitude: location.latitude ?? undefined,
      longitude: location.longitude ?? undefined,
      speed: location.speed ?? undefined,
      lastInactivityNotification:
        location.lastInactivityNotification ?? undefined,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(
    location: Location,
  ): Omit<LocationInsert, "id" | "userId" | "timestamp"> {
    return {
      isSharingLocation: location.isSharingLocation,
      accuracy: location.accuracy ?? undefined,
      altitude: location.altitude ?? undefined,
      altitudeAccuracy: location.altitudeAccuracy ?? undefined,
      heading: location.heading ?? undefined,
      latitude: location.latitude ?? undefined,
      longitude: location.longitude ?? undefined,
      speed: location.speed ?? undefined,
      lastInactivityNotification:
        location.lastInactivityNotification ?? undefined,
    };
  }
}

export const locationMapper = new LocationMapper();
