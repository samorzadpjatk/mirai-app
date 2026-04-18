import { Effect } from "effect";
import {
  TripParticipant,
  UserId,
  TripId,
  TripParticipantId,
} from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import type { ParticipantNumberUpdateDTO } from "../dto/UserDTOs";
import { UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for UpdateHouseNumberUseCase
 */
export interface UpdateHouseNumberInput {
  userId: UserId;
  tripId: TripId;
  houseNumber: string;
}

/**
 * Update House Number Use Case
 *
 * Assigns a house number to a trip participant.
 */
export class UpdateHouseNumberUseCase {
  execute(input: UpdateHouseNumberInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;

      // Find existing participant or create new one
      let participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        // Create new participant with house number
        const participantId = TripParticipantId.generate();
        const tripId = input.tripId;
        const userId = input.userId;

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
        participant = yield* participantPort.create(newParticipant);
      } else {
        // Update existing participant's house number
        const updatedParticipantEffect = participant.withHouseNumber(
          input.houseNumber,
        );
        const updatedParticipant = yield* updatedParticipantEffect;
        participant = yield* participantPort.update(updatedParticipant);
      }

      const result: ParticipantNumberUpdateDTO = {
        userId: UserId.toString(input.userId),
        tripId: TripId.toString(input.tripId),
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
      };

      return result;
    });
  }
}
