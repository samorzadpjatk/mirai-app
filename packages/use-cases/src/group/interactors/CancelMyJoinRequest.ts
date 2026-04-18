import { Effect } from "effect";
import { GroupId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  JoinRequestNotFoundError,
  TripHasEndedError,
} from "../errors/GroupErrors";

/**
 * Input for CancelMyJoinRequestUseCase
 */
export interface CancelMyJoinRequestInput {
  groupId: string;
  userId: string;
}

/**
 * Cancel My Join Request Use Case
 *
 * Cancels the user's pending join request.
 */
export class CancelMyJoinRequestUseCase {
  execute(
    input: CancelMyJoinRequestInput,
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
        return yield* Effect.fail(
          new JoinRequestNotFoundError({ requestId: "" }),
        );
      }

      // Delete the request
      yield* joinRequestPort.delete(request.id);

      return { success: true };
    });
  }
}
