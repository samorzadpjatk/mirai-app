import { Effect } from "effect";
import {
  Location,
  LocationId,
  ValidationError,
  LocationUpdated,
  type Coordinates,
} from "@mirai-app/domain";
import { UserId, TripId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { ThrottleServiceTag } from "../ports/ThrottleServicePort";
import type { LocationUpdateResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import {
  NotTripParticipantError,
  TripHasEndedError,
} from "../errors/LocationErrors";

/**
 * Input for UpdateLocationUseCase
 */
export interface UpdateLocationInput {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  tripId?: string;
}

/**
 * Update Location Use Case
 *
 * Updates the current user's location. Validates the user is in an active trip.
 * After saving, publishes LocationUpdated event to EventBus with throttling.
 */
export class UpdateLocationUseCase {
  execute(input: UpdateLocationInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;
      const eventBus = yield* EventBusTag;

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

      // If tripId specified, verify it matches
      if (input.tripId && input.tripId !== activeTripId) {
        const isParticipant = yield* participantPort.isParticipant(
          input.userId,
          input.tripId,
        );
        if (!isParticipant) {
          return yield* Effect.fail(
            new NotTripParticipantError({
              userId: input.userId,
              tripId: input.tripId,
            }),
          );
        }

        const tripId = TripId.unsafeCreate(input.tripId);
        const trip = yield* tripPort.findById(tripId);
        if (trip !== null && trip.hasEnded(now)) {
          return yield* Effect.fail(
            new TripHasEndedError({ tripId: input.tripId }),
          );
        }
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

      // Fire-and-forget event publishing after successful save
      // This runs in background and doesn't block the response
      const publishEvent = Effect.gen(function* () {
        // Get throttle service from DI context
        const throttleService = yield* ThrottleServiceTag;

        // Query sharing list: get users who should receive this location update
        // This is the list of users that the location owner is sharing with
        const sharingList = yield* locationPort.getSharingListForUser(userId);

        // Check throttle before publishing
        const shouldPublish = yield* throttleService.shouldPublish(userId, {
          lat: input.latitude,
          lng: input.longitude,
        });

        if (shouldPublish) {
          const eventId = crypto.randomUUID();
          const event = new LocationUpdated(
            eventId,
            userId,
            input.latitude,
            input.longitude,
            input.accuracy ?? null,
            location.timestamp,
            sharingList,
          );

          yield* eventBus.publish(event);
        }
      }).pipe(
        // Error isolation: publish failures don't block response
        Effect.catchAll((error) =>
          Effect.logError("Failed to publish location update event").pipe(
            Effect.annotateLogs({ error })
          )
        ),
        Effect.forkDaemon,
      );

      // Start publish in background (fire-and-forget)
      yield* publishEvent;

      return {
        success: true,
        locationId: location.id,
        timestamp: location.timestamp.getTime(),
      };
    });
  }
}
