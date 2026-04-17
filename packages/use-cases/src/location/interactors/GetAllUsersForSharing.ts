import { Effect } from "effect";
import { LocationPort } from "../ports/LocationPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { UserId } from "@mirai-app/domain";
import type { AvailableUsersForSharingDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetAllUsersForSharingUseCase
 */
export interface GetAllUsersForSharingInput {
  userId: string;
  tripId?: string;
}

/**
 * Get All Users For Sharing Use Case
 *
 * Retrieves users available for location sharing selection.
 */
export class GetAllUsersForSharingUseCase {
  execute(
    input: GetAllUsersForSharingInput,
  ): Effect.Effect<
    AvailableUsersForSharingDTO,
    ApplicationError,
    TripParticipantPort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;

      // Get shareable users (trip participants excluding current user)
      let shareableUserIds: string[] = [];

      if (input.tripId) {
        // Check if user is participant of the trip
        const isParticipant = yield* participantPort.isParticipant(
          input.userId,
          input.tripId,
        );

        if (!isParticipant) {
          return { users: [] };
        }

        const participants = yield* participantPort.findByTripId(input.tripId);
        shareableUserIds = participants
          .map((p) => p.userId)
          .filter((id) => id !== input.userId);
      } else {
        // Get all users from all trips the current user participates in
        const userParticipants = yield* participantPort.findByUserId(
          input.userId,
        );
        const uniqueUserIds = new Set<string>();

        for (const participant of userParticipants) {
          const tripParticipants = yield* participantPort.findByTripId(
            participant.tripId,
          );
          for (const tp of tripParticipants) {
            if (tp.userId !== input.userId) {
              uniqueUserIds.add(tp.userId);
            }
          }
        }

        shareableUserIds = [...uniqueUserIds];
      }

      if (shareableUserIds.length === 0) {
        return { users: [] };
      }

      // Note: User details will be hydrated by the adapter layer
      // We return just the IDs here; the adapter will fetch user details
      return {
        users: shareableUserIds.map((id) => ({
          id: UserId.unsafeCreate(id),
          firstName: null, // Will be hydrated by adapter
          lastName: null,
          image: null,
        })),
      };
    });
  }
}
