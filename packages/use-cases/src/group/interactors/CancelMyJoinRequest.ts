import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
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
  ): Effect.Effect<
    { success: boolean },
    | DatabaseError
    | GroupNotFoundError
    | JoinRequestNotFoundError
    | TripHasEndedError,
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
