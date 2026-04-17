import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import type { ApplicationError, ActivityFeedId } from "@mirai-app/domain";
import type { DeleteActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for DeleteActivityUseCase
 */
export interface DeleteActivityInput {
  activityId: ActivityFeedId;
}

/**
 * Delete Activity Use Case
 *
 * Deletes an activity and all its reactions.
 */
export class DeleteActivityUseCase {
  execute(
    input: DeleteActivityInput,
  ): Effect.Effect<
    DeleteActivityResultDTO,
    ActivityNotFoundError | ApplicationError,
    ActivityFeedPortTag | ActivityReactionPortTag
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const reactionPort = yield* ActivityReactionPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Delete all reactions first
      const reactions = yield* reactionPort.findByActivityId(input.activityId);
      yield* Effect.all(
        reactions.map((reaction) => reactionPort.delete(reaction.id)),
        { concurrency: "unbounded" },
      );

      // Delete the activity
      yield* activityPort.delete(input.activityId);

      return {
        success: true,
        activityId: input.activityId,
      };
    });
  }
}
