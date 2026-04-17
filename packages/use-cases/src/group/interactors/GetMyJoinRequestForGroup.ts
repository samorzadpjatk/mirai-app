import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { GroupJoinRequestDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for GetMyJoinRequestForGroupUseCase
 */
export interface GetMyJoinRequestForGroupInput {
  groupId: string;
  userId: string;
}

/**
 * Get My Join Request For Group Use Case
 *
 * Retrieves the pending join request for the current user.
 */
export class GetMyJoinRequestForGroupUseCase {
  execute(
    input: GetMyJoinRequestForGroupInput,
  ): Effect.Effect<
    GroupJoinRequestDTO | null,
    DatabaseError | GroupNotFoundError,
    GroupPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Find join request
      const request = yield* joinRequestPort.findByUserTripAndGroup(
        input.userId,
        group.tripId,
        group.id,
      );

      if (!request) {
        return null;
      }

      return {
        id: request.id,
        groupId: request.groupId,
        tripId: request.tripId,
        userId: request.userId,
        user: {
          id: request.userId,
          firstName: "", // Will be hydrated
          lastName: "",
          email: null,
        },
        status: request.status,
        requestedAt: request.requestedAt,
        decidedAt: request.decidedAt,
        decidedBy: null,
      };
    });
  }
}
