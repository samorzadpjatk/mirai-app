import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { TripWithParticipantsDTO } from "../dto/TripDTOs";
import type { TripId, UserId, GroupId } from "@mirai-app/domain";
import { TripNotFoundError } from "../errors/TripErrors";

/**
 * Participant with relations type from findByTripIdWithRelations
 */
interface ParticipantWithRelations {
  participant: {
    id: string;
    wristNumber: string | null;
    houseNumber: string | null;
    createdAt: Date;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  group: { id: string; name: string } | null;
}

/**
 * Input for GetTripByIdAdminUseCase
 */
export interface GetTripByIdAdminInput {
  tripId: TripId;
}

/**
 * Get Trip By ID Admin Use Case
 *
 * Retrieves a trip by ID with participants (admin view, no access check).
 */
export class GetTripByIdAdminUseCase {
  execute(input: GetTripByIdAdminInput) {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

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
        location: null,
        image: trip.backgroundImagePath,
        isActive: trip.isActive(new Date()),
        groups: [],
        tripSponsors: [],
        participants: participants.map((p: ParticipantWithRelations) => ({
          id: p.participant.id,
          userId: p.user.id as UserId,
          tripId: trip.id,
          groupId: p.group?.id ? (p.group.id as GroupId) : null,
          wristNumber: p.participant.wristNumber,
          houseNumber: p.participant.houseNumber,
          joinedAt: p.participant.createdAt,
          user: {
            id: p.user.id as UserId,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            email: null,
            role: p.user.role,
          },
          group: p.group
            ? {
                id: p.group.id as GroupId,
                name: p.group.name,
                image: null,
                coins: 0,
                participantCount: 0,
                isDeleted: false,
              }
            : null,
        })),
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      } as TripWithParticipantsDTO;
    });
  }
}
