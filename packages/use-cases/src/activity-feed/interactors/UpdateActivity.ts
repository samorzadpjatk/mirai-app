import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityFeed } from "@mirai-app/domain";
import type { ActivityFeedId } from "@mirai-app/domain";
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
  execute(input: UpdateActivityInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Update fields by creating a new ActivityFeed entity
      const now = new Date();
      const updatedEffect = ActivityFeed.create({
        id: activity.id,
        tripId: activity.tripId,
        activityType: activity.activityType,
        title: input.title ?? activity.title,
        description:
          input.description !== undefined
            ? input.description
            : activity.description,
        imageUrl:
          input.imageUrl !== undefined ? input.imageUrl : activity.imageUrl,
        isPinned: activity.isPinned,
        isHidden: activity.isHidden,
        hiddenByAdmin: activity.hiddenByAdmin,
        hiddenAt: activity.hiddenAt,
        hiddenReason: activity.hiddenReason,
        createdByAdmin: activity.createdByAdmin,
        createdAt: activity.createdAt,
        updatedAt: now,
      });

      const updated = yield* updatedEffect;

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
