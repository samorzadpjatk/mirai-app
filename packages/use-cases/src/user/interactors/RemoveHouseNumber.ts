import { Effect } from "effect";
import { UserId, TripId } from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import { UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for RemoveHouseNumberUseCase
 */
export interface RemoveHouseNumberInput {
  userId: UserId;
  tripId: TripId;
}

/**
 * Remove House Number Use Case
 *
 * Removes the house number from a trip participant.
 */
export class RemoveHouseNumberUseCase {
  execute(input: RemoveHouseNumberInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;

      // Find participant
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new UserNotInTripError({
            userId: UserId.toString(input.userId),
            tripId: TripId.toString(input.tripId),
          }),
        );
      }

      // Remove house number using domain entity method
      const updatedParticipantEffect = participant.withHouseNumber(null);
      const updatedParticipant = yield* updatedParticipantEffect;

      // Save updated participant
      const savedParticipant =
        yield* participantPort.update(updatedParticipant);

      const result: ParticipantNumberUpdateDTO = {
        userId: UserId.toString(input.userId),
        tripId: TripId.toString(input.tripId),
        wristNumber: savedParticipant.wristNumber,
        houseNumber: savedParticipant.houseNumber,
      };

      return result;
    });
  }
}
