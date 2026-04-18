import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityFeed } from "@mirai-app/domain";
import type { ActivityFeedId, UserId } from "@mirai-app/domain";
import type { HideActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for HideActivityUseCase
 */
export interface HideActivityInput {
  activityId: ActivityFeedId;
  adminId: UserId;
  reason?: string | null;
}

/**
 * Hide Activity Use Case
 *
 * Hides an activity (moderator/admin action).
 */
export class HideActivityUseCase {
  execute(input: HideActivityInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Use entity method to hide activity
      const updated = activity.hide(input.adminId, input.reason ?? null);

      // Save updated activity
      const saved = yield* activityPort.update(updated);

      const hiddenAt = saved.hiddenAt ?? new Date();

      return {
        id: saved.id,
        isHidden: saved.isHidden,
        hiddenAt,
        hiddenReason: saved.hiddenReason,
      };
    });
  }
}
