import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import type { ApplicationError, ActivityFeedId, UserId } from "@mirai-app/domain";
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
  execute(
    input: HideActivityInput,
  ): Effect.Effect<
    HideActivityResultDTO,
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

      const now = new Date();

      // Update activity with hidden status
      const updated = {
        ...activity,
        isHidden: true,
        hiddenByAdmin: input.adminId,
        hiddenAt: now,
        hiddenReason: input.reason ?? null,
        updatedAt: now,
      };

      // Save updated activity
      const saved = yield* activityPort.update(updated);

      return {
        id: saved.id,
        isHidden: saved.isHidden,
        hiddenAt: saved.hiddenAt ?? now,
        hiddenReason: saved.hiddenReason,
      };
    });
  }
}
