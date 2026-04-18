import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { GroupMemberDTO } from "../dto/GroupDTOs";
import { GroupId } from "@mirai-app/domain";

/**
 * Input for GetGroupByIdWithOrganizerUseCase
 */
export interface GetGroupByIdWithOrganizerInput {
  groupId: string;
}

/**
 * Get Group By ID With Organizer Use Case
 *
 * Retrieves a group with organizer info and stats (for moderators).
 */
export class GetGroupByIdWithOrganizerUseCase {
  execute(input: GetGroupByIdWithOrganizerInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return null;
      }

      const [participantCount, organizer] = yield* Effect.all([
        participantPort.countByTripId(group.tripId),
        userPort.findById(group.organizerId),
      ]);

      const organizerDto: GroupMemberDTO | null = organizer
        ? {
            id: organizer.id,
            firstName: organizer.firstName,
            lastName: organizer.lastName,
            email: null,
          }
        : null;

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        participantCount,
        organizer: organizerDto,
        isDeleted: group.isDeleted,
      };
    });
  }
}
