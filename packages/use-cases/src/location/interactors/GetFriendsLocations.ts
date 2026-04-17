import { Effect } from "effect";
import { LocationPort } from "../ports/LocationPort";
import { UserId } from "@mirai-app/domain";
import type {
  FriendsLocationsDTO,
  LocationWithUserDTO,
} from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

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
  ): Effect.Effect<FriendsLocationsDTO, ApplicationError, LocationPort> {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;

      const userId = UserId.unsafeCreate(input.userId);
      const locations = yield* locationPort.findByUserInSharingList(userId);

      // Filter only locations with sharing enabled
      const sharingLocations = locations.filter((loc) => loc.isSharingLocation);

      // Note: User details (names, avatars) will be hydrated by the adapter layer
      const locationDTOs: LocationWithUserDTO[] = sharingLocations.map(
        (location) => ({
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
          user: null, // Will be hydrated by adapter
        }),
      );

      return {
        locations: locationDTOs,
      };
    });
  }
}
