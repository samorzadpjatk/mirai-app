import { Effect } from "effect";
import { UserId, TripId } from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import { UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for RemoveWristNumberUseCase
 */
export interface RemoveWristNumberInput {
  userId: UserId;
  tripId: TripId;
}

/**
 * Remove Wrist Number Use Case
 *
 * Removes the wrist number from a trip participant.
 */
export class RemoveWristNumberUseCase {
  execute(input: RemoveWristNumberInput) {
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

      // Remove wrist number using domain entity method
      const updatedParticipantEffect = participant.withWristNumber(null);
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
