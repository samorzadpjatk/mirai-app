import { Effect } from "effect";
import { Location, LocationId, ValidationError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import {
  NotTripParticipantError,
  TripHasEndedError,
  InvalidSharingTargetError,
} from "../errors/LocationErrors";

/**
 * Input for AddUserToSharingUseCase
 */
export interface AddUserToSharingInput {
  userId: string;
  targetUserId: string;
}

/**
 * Add User To Sharing Use Case
 *
 * Adds a user to the sharing list.
 */
export class AddUserToSharingUseCase {
  execute(input: AddUserToSharingInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const userId = UserId.unsafeCreate(input.userId);

      // Check user is in an active trip
      const participants = yield* participantPort.findByUserId(userId);

      if (participants.length === 0) {
        return yield* Effect.fail(
          new NotTripParticipantError({ userId: input.userId }),
        );
      }

      let hasActiveTrip = false;
      const now = new Date();

      for (const participant of participants) {
        const trip = yield* tripPort.findById(participant.tripId);
        if (trip && !trip.hasEnded(now)) {
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

      // Check for self-sharing
      if (input.targetUserId === input.userId) {
        return yield* Effect.fail(
          new InvalidSharingTargetError({
            targetUserId: input.targetUserId,
            reason: "Cannot share location with yourself",
          }),
        );
      }

      // Validate target is in sharing scope
      let isShareable = false;
      for (const participant of participants) {
        const isTargetParticipant = yield* participantPort.isParticipant(
          UserId.unsafeCreate(input.targetUserId),
          participant.tripId,
        );
        if (isTargetParticipant) {
          isShareable = true;
          break;
        }
      }

      if (!isShareable) {
        return yield* Effect.fail(
          new InvalidSharingTargetError({
            targetUserId: input.targetUserId,
            reason: "User is not in your sharing scope",
          }),
        );
      }

      // Find or create location
      const existingLocation = yield* locationPort.findByUserId(userId);

      if (existingLocation) {
        // Connect user to sharing
        const targetUserId = UserId.unsafeCreate(input.targetUserId);
        yield* locationPort.connectUserToSharing(userId, targetUserId);
      } else {
        // Create new location with sharing enabled
        const locationId = LocationId.generate();
        const createEffect = Location.create({
          id: locationId,
          userId: userId,
          isSharingLocation: true,
          timestamp: new Date(),
          lastInactivityNotification: null,
        });

        const location = yield* createEffect;
        yield* locationPort.create(location);

        // Connect user to sharing
        const targetUserId = UserId.unsafeCreate(input.targetUserId);
        yield* locationPort.connectUserToSharing(userId, targetUserId);
      }

      // Return updated sharing list
      // Note: User details will be hydrated by the adapter layer
      return {
        success: true,
        usersToShareWith: [], // Will be populated by adapter
      };
    });
  }
}
