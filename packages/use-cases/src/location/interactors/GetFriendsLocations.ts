import { Effect } from "effect";
import { LocationPortTag } from "../ports/LocationPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { UserId } from "@mirai-app/domain";
import type {
  FriendsLocationsDTO,
  LocationWithUserDTO,
} from "../dto/LocationDTOs";
import type { ApplicationError, User } from "@mirai-app/domain";

/**
 * Input for GetFriendsLocationsUseCase
 */
export interface GetFriendsLocationsInput {
  userId: string;
}

/**
 * Get Friends Locations Use Case
 *
 * Retrieves locations of users who are sharing with the current user.
 */
export class GetFriendsLocationsUseCase {
  execute(
    input: GetFriendsLocationsInput,
  ) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const userPort = yield* UserPortTag;

      const userId = UserId.unsafeCreate(input.userId);
      const locations = yield* locationPort.findByUserInSharingList(userId);

      // Filter only locations with sharing enabled
      const sharingLocations = locations.filter((loc) => loc.isSharingLocation);

      // Fetch all user details in parallel
      const uniqueUserIds = Array.from(
        new Set(sharingLocations.map((loc) => loc.userId)),
      );
      const userEffects = uniqueUserIds.map((id) => userPort.findById(id));
      const users = yield* Effect.all(userEffects, { concurrency: "unbounded" });

      // Create a map for O(1) lookup
      const userMap = new Map<string, User | null>();
      uniqueUserIds.forEach((id, index) => {
        userMap.set(UserId.toString(id), users[index] ?? null);
      });

      // Build fully-populated DTOs
      const locationDTOs: LocationWithUserDTO[] = sharingLocations.map(
        (location) => {
          const user = userMap.get(UserId.toString(location.userId)) ?? null;
          return {
            id: location.id,
            userId: location.userId,
            timestamp: location.timestamp,
            isSharingLocation: location.isSharingLocation,
            accuracy: location.accuracy,
            altitude: location.altitude,
            altitudeAccuracy: location.altitudeAccuracy,
            heading: location.heading,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            lastInactivityNotification: location.lastInactivityNotification,
            user: user
              ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  image: user.hasAvatar
                    ? `avatar/${UserId.toString(user.id)}`
                    : null,
                }
              : null,
          };
        },
      );

      return {
        locations: locationDTOs,
      };
    });
  }
}
