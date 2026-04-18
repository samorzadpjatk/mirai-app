import { Effect } from "effect";
import { LocationPortTag } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserId } from "@mirai-app/domain";
import type { SharingListUpdateResultDTO } from "../dto/LocationDTOs";
import {
  NotTripParticipantError,
  TripHasEndedError,
} from "../errors/LocationErrors";

/**
 * Input for RemoveUserFromSharingUseCase
 */
export interface RemoveUserFromSharingInput {
  userId: string;
  targetUserId: string;
}

/**
 * Remove User From Sharing Use Case
 *
 * Removes a user from the sharing list.
 */
export class RemoveUserFromSharingUseCase {
  execute(input: RemoveUserFromSharingInput) {
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

      // Disconnect user from sharing
      const targetUserId = UserId.unsafeCreate(input.targetUserId);
      yield* locationPort.disconnectUserFromSharing(userId, targetUserId);

      // Return updated sharing list
      // Note: User details will be hydrated by the adapter layer
      return {
        success: true,
        usersToShareWith: [], // Will be populated by adapter
      };
    });
  }
}
