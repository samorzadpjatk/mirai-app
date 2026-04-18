import { Effect } from "effect";
import type { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import type { UserWithGroupInfoDTO, GroupInfoDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors";

/**
 * Input for GetUserWithGroupUseCase
 */
export interface GetUserWithGroupInput {
  userId: string;
  tripId: string;
}

/**
 * Get User With Group Use Case
 *
 * Retrieves a user with their group info for a specific trip.
 */
export class GetUserWithGroupUseCase {
  execute(
    input: GetUserWithGroupInput,
  ) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const groupPort = yield* GroupPortTag;

      // Find user by ID
      const user = yield* userPort.findById(input.userId as UserId);

      if (!user) {
        return Effect.fail(UserNotFoundError);
      }

      // Find participant with relations
      const participantWithRelations =
        yield* participantPort.findByUserAndTripWithRelations(
          input.userId,
          input.tripId,
        );

      const tripInfo = participantWithRelations
        ? {
            tripId: participantWithRelations.trip?.id ?? input.tripId,
            group: participantWithRelations.group,
            trip: participantWithRelations.trip,
          }
        : null;

      // Get groups where user is an organizer for this trip
      const organizerGroups = yield* groupPort.findByOrganizerId(input.userId);
      const organizerGroupForTrip = organizerGroups.find(
        (group) => group.tripId === input.tripId,
      );
      const organizerGroup: GroupInfoDTO | null = organizerGroupForTrip
        ? {
            id: organizerGroupForTrip.id,
            name: organizerGroupForTrip.name,
          }
        : null;

      const result: UserWithGroupInfoDTO = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        trips: tripInfo ? [tripInfo] : [],
        organizerGroup,
      };

      return result;
    });
  }
}
