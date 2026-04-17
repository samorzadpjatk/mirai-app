import { Effect } from "effect";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { UserId } from "@mirai-app/domain";
import type { SharingListUpdateResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
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
  execute(
    input: RemoveUserFromSharingInput,
  ): Effect.Effect<
    SharingListUpdateResultDTO,
    ApplicationError | NotTripParticipantError | TripHasEndedError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Check user is in an active trip
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
      const userId = UserId.unsafeCreate(input.userId);
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
