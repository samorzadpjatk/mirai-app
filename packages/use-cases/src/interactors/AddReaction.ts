import type { Result, ActivityId, ReactionType } from "@mirai-app/domain";
import { ok, err, ActivityReaction, emptyReactionCounts } from "@mirai-app/domain";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";

/**
 * Input for AddReaction use case
 */
export interface AddReactionInput {
  activityId: ActivityId;
  userId: string;
  reactionType: ReactionType;
}

/**
 * Output DTO for AddReaction use case
 */
export interface AddReactionOutput {
  activityId: string;
  reactionType: ReactionType;
  isActive: boolean;
  reactionsSummary: {
    total: number;
    counts: {
      heart: number;
      fire: number;
      clap: number;
      star: number;
    };
    myReactions: ReactionType[];
  };
}

/**
 * AddReaction Use Case
 *
 * Toggles a reaction on an activity (add if not exists, remove if exists).
 * Returns the updated reaction summary.
 */
export class AddReactionUseCase {
  constructor(private activityFeedRepository: ActivityFeedRepository) {}

  async execute(
    input: AddReactionInput,
  ): Promise<Result<AddReactionOutput, string>> {
    // Check if activity exists and is visible
    const activity = await this.activityFeedRepository.findById(
      input.activityId,
    );
    if (!activity) {
      return err("Activity not found");
    }

    if (activity.isHidden) {
      return err("Activity is hidden");
    }

    // Check if user already has this reaction
    const existingReactions =
      await this.activityFeedRepository.findUserReactions(
        input.activityId,
        input.userId,
      );
    const hasExistingReaction = existingReactions.some(
      (r) => r.reactionType === input.reactionType,
    );

    let isActive: boolean;

    if (hasExistingReaction) {
      // Remove reaction (toggle off)
      await this.activityFeedRepository.removeReaction(
        input.activityId,
        input.userId,
        input.reactionType,
      );
      isActive = false;
    } else {
      // Add reaction (toggle on)
      const reactionResult = ActivityReaction.create({
        activityId: input.activityId,
        userId: input.userId,
        reactionType: input.reactionType,
      });

      if (reactionResult.kind === "err") {
        return err(reactionResult.error);
      }

      await this.activityFeedRepository.addReaction(reactionResult.value);
      isActive = true;
    }

    // Get updated reaction summary
    const [counts, userReactions] = await Promise.all([
      this.activityFeedRepository.getReactionCounts(input.activityId),
      this.activityFeedRepository.findUserReactions(
        input.activityId,
        input.userId,
      ),
    ]);

    return ok({
      activityId: input.activityId,
      reactionType: input.reactionType,
      isActive,
      reactionsSummary: {
        total: counts.total,
        counts: counts.counts,
        myReactions: userReactions.map((r) => r.reactionType),
      },
    });
  }
}
