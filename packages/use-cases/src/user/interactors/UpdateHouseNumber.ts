import { Effect } from "effect";
import type { ApplicationError, ValidationError } from "@mirai-app/domain";
import {
  TripParticipant,
  UserId,
  TripId,
  TripParticipantId,
} from "@mirai-app/domain";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import { UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for UpdateHouseNumberUseCase
 */
export interface UpdateHouseNumberInput {
  userId: string;
  tripId: string;
  houseNumber: string;
}

/**
 * Update House Number Use Case
 *
 * Assigns a house number to a trip participant.
 */
export class UpdateHouseNumberUseCase {
  execute(
    input: UpdateHouseNumberInput,
  ): Effect.Effect<
    ParticipantNumberUpdateDTO,
    ApplicationError | UserNotInTripError | ValidationError,
    TripParticipantPort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;

      // Find existing participant or create new one
      let participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        // Create new participant with house number
        const participantId = TripParticipantId.generate();
        const tripId = TripId.unsafeCreate(input.tripId);
        const userId = UserId.unsafeCreate(input.userId);

        const newParticipantEffect = TripParticipant.create({
          id: participantId,
          userId: userId,
          tripId: tripId,
          groupId: null,
          wristNumber: null,
          houseNumber: input.houseNumber,
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const newParticipant = yield* newParticipantEffect;
        participant = yield* participantPort.upsert(newParticipant);
      } else {
        // Update existing participant's house number
        const updatedParticipantEffect = participant.withHouseNumber(
          input.houseNumber,
        );
        const updatedParticipant = yield* updatedParticipantEffect;
        participant = yield* participantPort.upsert(updatedParticipant);
      }

      const result: ParticipantNumberUpdateDTO = {
        userId: input.userId,
        tripId: input.tripId,
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
      };

      return result;
    });
  }
}
