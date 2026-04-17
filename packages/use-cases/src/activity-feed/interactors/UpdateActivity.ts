import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import type { ApplicationError, ActivityFeedId } from "@mirai-app/domain";
import type { UpdateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for UpdateActivityUseCase
 */
export interface UpdateActivityInput {
  activityId: ActivityFeedId;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Update Activity Use Case
 *
 * Updates an existing activity's content.
 */
export class UpdateActivityUseCase {
  execute(
    input: UpdateActivityInput,
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

      // Update fields
      const now = new Date();
      const updated = {
        ...activity,
        title: input.title ?? activity.title,
        description:
          input.description !== undefined
            ? input.description
            : activity.description,
        imageUrl:
          input.imageUrl !== undefined ? input.imageUrl : activity.imageUrl,
        updatedAt: now,
      };

      // Save updated activity
      const saved = yield* activityPort.update(updated);

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
