import { Effect } from "effect";
import {
  TripParticipant,
  UserId,
  TripId,
  TripParticipantId,
} from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import {
  UserNotInTripError,
  WristNumberAlreadyTakenError,
} from "../errors/UserErrors";

/**
 * Input for UpdateWristNumberUseCase
 */
export interface UpdateWristNumberInput {
  userId: UserId;
  tripId: TripId;
  wristNumber: string;
}

/**
 * Update Wrist Number Use Case
 *
 * Assigns a wrist number to a trip participant.
 */
export class UpdateWristNumberUseCase {
  execute(input: UpdateWristNumberInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;

      // Check if wrist number is already taken by another user
      const existingParticipant = yield* participantPort.findByWristNumber(
        input.tripId,
        input.wristNumber,
        input.userId,
      );

      if (existingParticipant) {
        return yield* Effect.fail(
          new WristNumberAlreadyTakenError({
            wristNumber: input.wristNumber,
            tripId: TripId.toString(input.tripId),
            takenByUserId: UserId.toString(existingParticipant.userId),
          }),
        );
      }

      // Find existing participant or create new one
      let participant = yield* participantPort.findByUserAndTrip(
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

      // Update wrist number using domain entity method
      const updatedParticipantEffect = participant.withWristNumber(
        input.wristNumber,
      );
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
