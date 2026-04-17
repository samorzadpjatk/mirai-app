import { Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import type { UserWithGroupInfoDTO, GroupInfoDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

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
  ): Effect.Effect<
    UserWithGroupInfoDTO | null,
    ApplicationError | UserNotFoundError,
    UserPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPort;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return null;
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

      // TODO: Get organizer group info - this would need a GroupPort
      const organizerGroup: GroupInfoDTO | null = null;

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
