import { Effect } from "effect";
import { Location, LocationId, ValidationError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { LocationUpdateResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import {
  NotTripParticipantError,
  TripHasEndedError,
} from "../errors/LocationErrors";

/**
 * Input for UpdateLocationStreamUseCase
 */
export interface UpdateLocationStreamInput {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * Result type for streaming location updates
 */
export interface UpdateLocationStreamResult {
  location: LocationUpdateResultDTO;
}

/**
 * Update Location Stream Use Case
 *
 * Updates the current user's location and returns a single result.
 * This use case is designed to be called repeatedly for streaming scenarios.
 */
export class UpdateLocationStreamUseCase {
  execute(
    input: UpdateLocationStreamInput,
  ): Effect.Effect<
    UpdateLocationStreamResult,
    | ApplicationError
    | NotTripParticipantError
    | TripHasEndedError
    | ValidationError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Check if user is in an active trip
      const participants = yield* participantPort.findByUserId(input.userId);

      if (participants.length === 0) {
        return yield* Effect.fail(
          new NotTripParticipantError({ userId: input.userId }),
        );
      }

      // Find an active trip
      let activeTripId: string | null = null;
      const now = new Date();

      for (const participant of participants) {
        const trip = yield* tripPort.findById(participant.tripId);
        if (trip !== null && !trip.hasEnded(now)) {
          activeTripId = trip.id;
          break;
        }
      }

      if (activeTripId === null) {
        const firstParticipant = participants[0];
        if (firstParticipant === undefined) {
          return yield* Effect.fail(
            new NotTripParticipantError({ userId: input.userId }),
          );
        }
        return yield* Effect.fail(
          new TripHasEndedError({ tripId: firstParticipant.tripId }),
        );
      }

      // Find existing location or create new one
      const userId = UserId.unsafeCreate(input.userId);
      const existingLocation = yield* locationPort.findByUserId(userId);

      let location: Location;

      if (existingLocation) {
        // Update coordinates
        const updatedEffect = existingLocation.withCoordinates({
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy ?? null,
          altitude: input.altitude ?? null,
          altitudeAccuracy: input.altitudeAccuracy ?? null,
          heading: input.heading ?? null,
          speed: input.speed ?? null,
        });

        location = yield* updatedEffect;
        location = yield* locationPort.update(location);
      } else {
        // Create new location
        const locationId = LocationId.generate();
        const createEffect = Location.create({
          id: locationId,
          userId: userId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy ?? null,
          altitude: input.altitude ?? null,
          altitudeAccuracy: input.altitudeAccuracy ?? null,
          heading: input.heading ?? null,
          speed: input.speed ?? null,
          isSharingLocation: true,
          timestamp: new Date(),
          lastInactivityNotification: null,
        });

        location = yield* createEffect;
        location = yield* locationPort.create(location);
      }

      return {
        location: {
          success: true,
          locationId: location.id,
          timestamp: location.timestamp.getTime(),
        },
      };
    });
  }
}
