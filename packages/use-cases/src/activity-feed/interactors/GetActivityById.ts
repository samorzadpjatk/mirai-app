import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import type { ActivityFeedId } from "@mirai-app/domain";
import type { ActivityWithReactionsDTO } from "../dto/ActivityFeedDTOs";
import { ActivityNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for GetActivityByIdUseCase
 */
export interface GetActivityByIdInput {
  activityId: ActivityFeedId;
  userId: string;
}

/**
 * Get Activity By ID Use Case
 *
 * Retrieves a single activity by ID with reaction counts.
 */
export class GetActivityByIdUseCase {
  execute(input: GetActivityByIdInput) {
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

      // Get reactions
      const reactions = yield* reactionPort.findByActivityId(activity.id);
      const userReactions = reactions.filter((r) => r.userId === input.userId);

      // Count reactions by type
      const reactionCounts = {
        heart: reactions.filter((r) => r.reactionType === "heart").length,
        fire: reactions.filter((r) => r.reactionType === "fire").length,
        clap: reactions.filter((r) => r.reactionType === "clap").length,
        star: reactions.filter((r) => r.reactionType === "star").length,
      };

      return {
        id: activity.id,
        tripId: activity.tripId,
        activityType: activity.activityType,
        title: activity.title,
        description: activity.description,
        imageUrl: activity.imageUrl,
        isPinned: activity.isPinned,
        isHidden: activity.isHidden,
        hiddenAt: activity.hiddenAt,
        hiddenReason: activity.hiddenReason,
        createdByAdmin: activity.createdByAdmin,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        admin: null, // Will be hydrated by adapter
        hiddenBy: null, // Will be hydrated by adapter
        submissionDetails: null, // Will be hydrated by adapter
        challengeDetails: null, // Will be hydrated by adapter
        rankChangeDetails: null, // Will be hydrated by adapter
        reactions: reactionCounts,
        userReactions: userReactions.map((r) => r.reactionType),
      };
    });
  }
}
