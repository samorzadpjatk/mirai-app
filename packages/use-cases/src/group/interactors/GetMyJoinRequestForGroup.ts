import { Effect } from "effect";
import { GroupId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
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
  ) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      // Find the group
      const groupId = GroupId.unsafeCreate(input.groupId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Find join request
      const userId = UserId.unsafeCreate(input.userId);
      const request = yield* joinRequestPort.findByUserTripAndGroup(
        userId,
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
          id: UserId.toString(request.userId),
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
