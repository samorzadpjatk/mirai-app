import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { TripWithParticipantsDTO } from "../dto/TripDTOs";
import type { ApplicationError, TripId } from "@mirai-app/domain";
import {
  TripNotFoundError,
  NotTripParticipantError,
} from "../errors/TripErrors";

/**
 * Input for GetTripByIdUseCase
 */
export interface GetTripByIdInput {
  tripId: TripId;
  userId: string;
}

/**
 * Get Trip By ID Use Case
 *
 * Retrieves a trip by ID with participants (requires participant access).
 */
export class GetTripByIdUseCase {
  execute(
    input: GetTripByIdInput,
  ): Effect.Effect<
    TripWithParticipantsDTO,
    ApplicationError | TripNotFoundError | NotTripParticipantError,
    TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Check if user is a participant
      const isParticipant = yield* participantPort.isParticipant(
        input.userId,
        input.tripId,
      );

      if (!isParticipant) {
        return yield* Effect.fail(
          new NotTripParticipantError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Get trip
      const trip = yield* tripPort.findById(input.tripId);

      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Get participants
      const participants = yield* participantPort.findByTripIdWithRelations(
        input.tripId,
      );

      return {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        location: null, // Will be hydrated by adapter
        image: trip.backgroundImagePath,
        isActive: trip.isActive(new Date()),
        groups: [], // Will be hydrated by adapter
        tripSponsors: [], // Will be hydrated by adapter
        participants: participants.map((p) => ({
          id: p.participant.id,
          userId: p.user.id,
          tripId: trip.id,
          groupId: p.group?.id ?? null,
          wristNumber: p.participant.wristNumber,
          houseNumber: p.participant.houseNumber,
          joinedAt: p.participant.joinedAt,
          user: {
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            email: null, // Will be hydrated by adapter
            role: p.user.role,
          },
          group: p.group
            ? {
                id: p.group.id,
                name: p.group.name,
                image: null,
                coins: 0, // Will be hydrated by adapter
                participantCount: 0, // Will be hydrated by adapter
                isDeleted: false,
              }
            : null,
        })),
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      };
    });
  }
}
