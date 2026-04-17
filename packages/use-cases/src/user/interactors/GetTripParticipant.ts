import { Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import type { TripParticipantDTO } from "../dto/UserDTOs";

/**
 * Input for GetTripParticipantUseCase
 */
export interface GetTripParticipantInput {
  userId: string;
  tripId: string;
}

/**
 * Get Trip Participant Use Case
 *
 * Retrieves trip participant information for a user.
 */
export class GetTripParticipantUseCase {
  execute(
    input: GetTripParticipantInput,
  ): Effect.Effect<
    TripParticipantDTO | null,
    ApplicationError,
    TripParticipantPort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;

      // Find participant with relations
      const result = yield* participantPort.findByUserAndTripWithRelations(
        input.userId,
        input.tripId,
      );

      if (!result) {
        return null;
      }

      const dto: TripParticipantDTO = {
        userId: input.userId,
        tripId: input.tripId,
        wristNumber: result.participant.wristNumber,
        houseNumber: result.participant.houseNumber,
        group: result.group,
      };

      return dto;
    });
  }
}
