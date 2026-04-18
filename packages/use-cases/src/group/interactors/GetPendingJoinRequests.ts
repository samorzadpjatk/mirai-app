import { Effect } from "effect";
import { GroupId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { GroupJoinRequestDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
} from "../errors/GroupErrors";

/**
 * Input for GetPendingJoinRequestsUseCase
 */
export interface GetPendingJoinRequestsInput {
  groupId: string;
  userId: string;
}

/**
 * Get Pending Join Requests Use Case
 *
 * Retrieves pending join requests for group organizer.
 */
export class GetPendingJoinRequestsUseCase {
  execute(
    input: GetPendingJoinRequestsInput,
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

      // Check if user is the organizer
      if (group.organizerId !== input.userId) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Get pending requests
      const requests = yield* joinRequestPort.findPendingByGroupId(group.id);

      return requests.map((request) => ({
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
      }));
    });
  }
}
