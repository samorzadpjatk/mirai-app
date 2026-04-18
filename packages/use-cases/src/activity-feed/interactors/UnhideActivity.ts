import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import type { ActivityFeedId } from "@mirai-app/domain";
import type { UnhideActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for UnhideActivityUseCase
 */
export interface UnhideActivityInput {
  activityId: ActivityFeedId;
}

/**
 * Unhide Activity Use Case
 *
 * Unhides a previously hidden activity.
 */
export class UnhideActivityUseCase {
  execute(input: UnhideActivityInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Use entity method to unhide activity
      const updated = activity.unhide();

      // Save updated activity
      const saved = yield* activityPort.update(updated);

      return {
        id: saved.id,
        isHidden: saved.isHidden,
        unhiddenAt: new Date(),
      };
    });
  }
}
