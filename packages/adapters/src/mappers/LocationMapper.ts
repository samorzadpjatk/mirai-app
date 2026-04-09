import { Location, SharingUserInfo, type LocationId } from "@repo/domain";

/**
 * Prisma Location record type
 */
interface PrismaLocationRecord {
  id: string;
  userId: string;
  timestamp: Date;
  isSharingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  lastInactivityNotification: Date | null;
  usersToShareWith?: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    hasAvatar?: boolean | null;
  }>;
}

/**
 * LocationMapper
 *
 * Maps between Prisma database records and domain Location entities.
 * This is a pure function with no side effects.
 */
export class LocationMapper {
  /**
   * Convert a Prisma Location record to a domain Location entity
   */
  static toDomain(record: PrismaLocationRecord): Location {
    const sharingUsers: SharingUserInfo[] =
      record.usersToShareWith?.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        hasAvatar: user.hasAvatar,
      })) ?? [];

    return Location.reconstitute({
      id: record.id as LocationId,
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
      usersToShareWith: sharingUsers,
    });
  }

  /**
   * Convert a domain Location entity to Prisma create input
   */
  static toPrismaCreate(location: Location): {
    id: string;
    userId: string;
    timestamp: Date;
    isSharingLocation: boolean;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    lastInactivityNotification: Date | null;
    usersToShareWith?: { connect: Array<{ id: string }> };
  } {
    const data: ReturnType<typeof this.toPrismaCreate> = {
      id: location.id,
      userId: location.userId,
      timestamp: location.timestamp,
      isSharingLocation: location.isSharingLocation(),
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      lastInactivityNotification: location.lastInactivityNotification,
    };

    // Connect sharing users if any
    if (location.usersToShareWith.length > 0) {
      data.usersToShareWith = {
        connect: location.usersToShareWith.map((user) => ({ id: user.id })),
      };
    }

    return data;
  }

  /**
   * Convert a domain Location entity to Prisma update input
   */
  static toPrismaUpdate(location: Location): {
    timestamp: Date;
    isSharingLocation: boolean;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    lastInactivityNotification: Date | null;
    usersToShareWith?: { set: Array<{ id: string }> };
  } {
    const data: ReturnType<typeof this.toPrismaUpdate> = {
      timestamp: location.timestamp,
      isSharingLocation: location.isSharingLocation(),
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      lastInactivityNotification: location.lastInactivityNotification,
    };

    // Set sharing users (replaces entire list)
    data.usersToShareWith = {
      set: location.usersToShareWith.map((user) => ({ id: user.id })),
    };

    return data;
  }

  /**
   * Convert a domain Location entity to Prisma upsert input (for adding single user)
   */
  static toPrismaUpsertAddUser(
    location: Location,
    newUserId: string,
  ): {
    usersToShareWith: { connect: { id: string } };
  } {
    return {
      usersToShareWith: {
        connect: { id: newUserId },
      },
    };
  }

  /**
   * Convert a domain Location entity to Prisma upsert input (for removing single user)
   */
  static toPrismaUpsertRemoveUser(
    location: Location,
    removeUserId: string,
  ): {
    usersToShareWith: { disconnect: { id: string } };
  } {
    return {
      usersToShareWith: {
        disconnect: { id: removeUserId },
      },
    };
  }
}
