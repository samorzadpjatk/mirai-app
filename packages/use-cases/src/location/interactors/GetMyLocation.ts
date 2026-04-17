import { Effect } from "effect";
import { LocationPort } from "../ports/LocationPort";
import { UserId } from "@mirai-app/domain";
import type { MyLocationDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetMyLocationUseCase
 */
export interface GetMyLocationInput {
  userId: string;
}

/**
 * Get My Location Use Case
 *
 * Retrieves the current user's location.
 */
export class GetMyLocationUseCase {
  execute(
    input: GetMyLocationInput,
  ): Effect.Effect<MyLocationDTO, ApplicationError, LocationPort> {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;

      const userId = UserId.unsafeCreate(input.userId);
      const location = yield* locationPort.findByUserId(userId);

      if (!location) {
        return { location: null };
      }

      return {
        location: {
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
        },
      };
    });
  }
}
