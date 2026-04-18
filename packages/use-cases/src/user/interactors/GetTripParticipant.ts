import { Effect } from "effect";
import { UserId, TripId } from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import type { TripParticipantDTO } from "../dto/UserDTOs";

/**
 * Input for GetTripParticipantUseCase
 */
export interface GetTripParticipantInput {
  userId: UserId;
  tripId: TripId;
}

/**
 * Get Trip Participant Use Case
 *
 * Retrieves trip participant information for a user.
 */
export class GetTripParticipantUseCase {
  execute(input: GetTripParticipantInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;

      // Find participant with relations
      const result = yield* participantPort.findByUserAndTripWithRelations(
        input.userId,
        input.tripId,
      );

      if (!result) {
        return null;
      }

      const dto: TripParticipantDTO = {
        userId: UserId.toString(input.userId),
        tripId: TripId.toString(input.tripId),
        wristNumber: result.participant.wristNumber,
        houseNumber: result.participant.houseNumber,
        group: result.group,
      };

      return dto;
    });
  }
}
