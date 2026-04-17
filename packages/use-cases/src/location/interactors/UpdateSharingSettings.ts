import { Effect } from "effect";
import { Location, LocationId, ValidationError } from "@mirai-app/domain";
import { UserId, TripId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { SharingSettingsUpdateResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import {
  NotTripParticipantError,
  TripHasEndedError,
  InvalidSharingTargetError,
} from "../errors/LocationErrors";

/**
 * Input for UpdateSharingSettingsUseCase
 */
export interface UpdateSharingSettingsInput {
  userId: string;
  isSharingLocation: boolean;
  userIdsToShareWith?: string[];
  tripId?: string;
}

/**
 * Update Sharing Settings Use Case
 *
 * Updates the user's location sharing settings.
 */
export class UpdateSharingSettingsUseCase {
  execute(
    input: UpdateSharingSettingsInput,
  ): Effect.Effect<
    SharingSettingsUpdateResultDTO,
    | ApplicationError
    | NotTripParticipantError
    | TripHasEndedError
    | InvalidSharingTargetError
    | ValidationError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Validate trip participation
      if (input.tripId) {
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
        if (trip !== null && trip.hasEnded()) {
          return yield* Effect.fail(
            new TripHasEndedError({ tripId: input.tripId }),
          );
        }
      } else {
        // Check user is in any active trip
        const participants = yield* participantPort.findByUserId(input.userId);

        if (participants.length === 0) {
          return yield* Effect.fail(
            new NotTripParticipantError({ userId: input.userId }),
          );
        }

        let hasActiveTrip = false;
        const now = new Date();

        for (const participant of participants) {
          const trip = yield* tripPort.findById(participant.tripId);
          if (trip !== null && !trip.hasEnded(now)) {
            hasActiveTrip = true;
            break;
          }
        }

        if (!hasActiveTrip) {
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
      }

      // Validate sharing targets if provided
      if (input.userIdsToShareWith && input.userIdsToShareWith.length > 0) {
        // Check for self-sharing
        if (input.userIdsToShareWith.includes(input.userId)) {
          return yield* Effect.fail(
            new InvalidSharingTargetError({
              targetUserId: input.userId,
              reason: "Cannot share location with yourself",
            }),
          );
        }

        // Get shareable users (trip participants)
        let shareableUserIds: Set<string>;

        if (input.tripId) {
          const participants = yield* participantPort.findByTripId(
            input.tripId,
          );
          shareableUserIds = new Set(
            participants
              .map((p) => p.userId)
              .filter((id) => id !== input.userId),
          );
        } else {
          const userParticipants = yield* participantPort.findByUserId(
            input.userId,
          );
          shareableUserIds = new Set();

          for (const participant of userParticipants) {
            const tripParticipants = yield* participantPort.findByTripId(
              participant.tripId,
            );
            for (const tp of tripParticipants) {
              if (tp.userId !== input.userId) {
                shareableUserIds.add(tp.userId);
              }
            }
          }
        }

        // Validate all targets are shareable
        for (const targetId of input.userIdsToShareWith) {
          if (!shareableUserIds.has(targetId)) {
            return yield* Effect.fail(
              new InvalidSharingTargetError({
                targetUserId: targetId,
                reason: "User is not in your sharing scope",
              }),
            );
          }
        }
      }

      // Find or create location
      const userId = UserId.unsafeCreate(input.userId);
      const existingLocation = yield* locationPort.findByUserId(userId);

      let location: Location;

      if (existingLocation) {
        // Update sharing status
        location = input.isSharingLocation
          ? existingLocation.enableSharing()
          : existingLocation.disableSharing();
        location = yield* locationPort.update(location);
      } else {
        // Create new location with sharing enabled
        const locationId = LocationId.generate();
        const createEffect = Location.create({
          id: locationId,
          userId: userId,
          isSharingLocation: input.isSharingLocation,
          timestamp: new Date(),
          lastInactivityNotification: null,
        });

        location = yield* createEffect;
        location = yield* locationPort.create(location);
      }

      // Update sharing list if targets provided
      if (input.userIdsToShareWith && input.userIdsToShareWith.length > 0) {
        const userIds = input.userIdsToShareWith.map((id) =>
          UserId.unsafeCreate(id),
        );
        yield* locationPort.setUsersToShareWith(userId, userIds);
      }

      // Return sharing settings
      // Note: User details (names, avatars) will be hydrated by the adapter layer
      return {
        isSharingLocation: location.isSharingLocation,
        usersToShareWith: [], // Will be populated by adapter
      };
    });
  }
}
