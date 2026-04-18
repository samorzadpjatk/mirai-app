import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import { ActivityReactionIdFactory } from "@mirai-app/domain";
import type { ActivityFeedId, UserId, ActivityReaction } from "@mirai-app/domain";
import type { ToggleReactionResultDTO } from "../dto/ActivityFeedDTOs";
import type { ActivityReactionType } from "../ports/ActivityReactionPort";
import {
  ActivityNotFoundError,
  InvalidReactionTypeError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for ToggleActivityReactionUseCase
 */
export interface ToggleActivityReactionInput {
  activityId: ActivityFeedId;
  userId: UserId;
  reactionType: ActivityReactionType;
}

const VALID_REACTION_TYPES: ActivityReactionType[] = [
  "heart",
  "fire",
  "clap",
  "star",
];

/**
 * Toggle Activity Reaction Use Case
 *
 * Toggles a reaction on an activity. If the user already reacted with the same type,
 * removes the reaction. Otherwise, adds the reaction.
 */
export class ToggleActivityReactionUseCase {
  execute(input: ToggleActivityReactionInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const reactionPort = yield* ActivityReactionPortTag;

      // Validate reaction type
      if (!VALID_REACTION_TYPES.includes(input.reactionType)) {
        return yield* Effect.fail(
          new InvalidReactionTypeError({
            reactionType: input.reactionType,
            allowedTypes: VALID_REACTION_TYPES,
          }),
        );
      }

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Check if user already has this reaction
      const existingReaction = yield* reactionPort.findByActivityIdAndUserId(
        input.activityId,
        input.userId,
      );

      if (existingReaction) {
        // Remove existing reaction
        yield* reactionPort.delete(existingReaction.id);

        // Get updated count
        const allReactions = yield* reactionPort.findByActivityId(
          input.activityId,
        );
        const count = allReactions.filter(
          (r) => r.reactionType === input.reactionType,
        ).length;

        return {
          activityId: input.activityId,
          reactionType: input.reactionType,
          isAdded: false,
          reactionCount: count,
        };
      }

      // Add new reaction
      const now = new Date();
      const newReaction: Omit<ActivityReaction, "id"> = {
        activityId: input.activityId,
        userId: input.userId,
        reactionType: input.reactionType,
        createdAt: now,
      };
      yield* reactionPort.create({
        id: ActivityReactionIdFactory.generate(),
        ...newReaction,
      });

      // Get updated count
      const allReactions = yield* reactionPort.findByActivityId(
        input.activityId,
      );
      const count = allReactions.filter(
        (r) => r.reactionType === input.reactionType,
      ).length;

      return {
        activityId: input.activityId,
        reactionType: input.reactionType,
        isAdded: true,
        reactionCount: count,
      };
    });
  }
}
