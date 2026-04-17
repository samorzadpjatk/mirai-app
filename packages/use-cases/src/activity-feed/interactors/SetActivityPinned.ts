import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import type { ApplicationError, ActivityFeedId } from "@mirai-app/domain";
import type { UpdateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for SetActivityPinnedUseCase
 */
export interface SetActivityPinnedInput {
  activityId: ActivityFeedId;
  isPinned: boolean;
}

/**
 * Set Activity Pinned Use Case
 *
 * Pins or unpins an activity.
 */
export class SetActivityPinnedUseCase {
  execute(
    input: SetActivityPinnedInput,
  ): Effect.Effect<
    UpdateActivityResultDTO,
    ActivityNotFoundError | ApplicationError,
    ActivityFeedPortTag
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Set pinned status
      const saved = yield* activityPort.setPinned(
        input.activityId,
        input.isPinned,
      );

      return {
        id: saved.id,
        title: saved.title,
        description: saved.description,
        isPinned: saved.isPinned,
        updatedAt: saved.updatedAt,
      };
    });
  }
}
