import { Effect } from "effect";
import type { ApplicationError, ValidationError } from "@mirai-app/domain";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import { UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for RemoveWristNumberUseCase
 */
export interface RemoveWristNumberInput {
  userId: string;
  tripId: string;
}

/**
 * Remove Wrist Number Use Case
 *
 * Removes the wrist number from a trip participant.
 */
export class RemoveWristNumberUseCase {
  execute(
    input: RemoveWristNumberInput,
  ): Effect.Effect<
    ParticipantNumberUpdateDTO,
    ApplicationError | UserNotInTripError | ValidationError,
    TripParticipantPort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;

      // Find participant
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new UserNotInTripError({
            userId: input.userId,
            tripId: input.tripId,
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
        userId: input.userId,
        tripId: input.tripId,
        wristNumber: savedParticipant.wristNumber,
        houseNumber: savedParticipant.houseNumber,
      };

      return result;
    });
  }
}
