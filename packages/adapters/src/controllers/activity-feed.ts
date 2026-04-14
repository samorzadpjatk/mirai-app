import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getActivityFeedUseCase,
  createActivityUseCase,
  addReactionUseCase,
  getActivityByIdUseCase,
  updateActivityUseCase,
  hideActivityUseCase,
  unhideActivityUseCase,
  deleteActivityUseCase,
  ActivityFeedRepositoryTag,
} from "@mirai-app/use-cases";
import type { ActivityId, ReactionType } from "@mirai-app/domain";

/**
 * Input validation schemas for activity feed controller
 */
const schemas = {
  getByTrip: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    pageSize: z.number().int().min(1).max(100).optional(),
    cursor: z
      .object({
        id: z.string(),
        createdAt: z.coerce.date(),
        isPinned: z.boolean(),
      })
      .optional(),
  }),

  getById: z.object({
    id: z.string().min(1, "Activity ID is required"),
  }),

  createCustom: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    imageUrl: z.string().optional(),
    isPinned: z.boolean().optional(),
    createdByAdmin: z.string().optional(),
  }),

  createUserPost: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    imageUrl: z.string().optional(),
    userPost: z.object({
      authorId: z.string(),
      authorUserId: z.string(),
      authorFirstName: z.string(),
      authorLastName: z.string(),
      authorHasAvatar: z.boolean(),
      groupId: z.string().nullable(),
      groupName: z.string().nullable(),
      additionalImages: z.array(z.string()),
    }),
  }),

  createSubmission: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    imageUrl: z.string().optional(),
    isPinned: z.boolean().optional(),
    createdByAdmin: z.string().optional(),
    submissionActivity: z.object({
      submissionId: z.string(),
      challengeId: z.string(),
      groupId: z.string(),
      hasVideo: z.boolean().optional(),
      isWinner: z.boolean().nullable().optional(),
      ranking: z.number().int().nullable().optional(),
      pointsAwarded: z.number().int().nullable().optional(),
    }),
  }),

  createChallengeEvent: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    imageUrl: z.string().optional(),
    isPinned: z.boolean().optional(),
    createdByAdmin: z.string().optional(),
    challengeActivity: z.object({
      challengeId: z.string(),
      eventType: z.enum(["challenge_started", "voting_started", "completed"]),
      endTime: z.coerce.date().nullable().optional(),
      submissionType: z.string().nullable().optional(),
      basePoints: z.number().int().nullable().optional(),
      submissionCount: z.number().int().nullable().optional(),
    }),
  }),

  createRankChange: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    imageUrl: z.string().optional(),
    isPinned: z.boolean().optional(),
    createdByAdmin: z.string().optional(),
    rankChangeActivity: z.object({
      groupId: z.string(),
      newRank: z.number().int().min(1),
      totalCoins: z.number().int().min(0),
      coinsGained: z.number().int(),
    }),
  }),

  update: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    isPinned: z.boolean().optional(),
  }),

  setPinned: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
    isPinned: z.boolean(),
  }),

  hide: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
    hiddenByAdmin: z.string().min(1, "Admin ID is required"),
    reason: z.string().trim().optional(),
  }),

  unhide: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
  }),

  addReaction: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
    userId: z.string().min(1, "User ID is required"),
    reactionType: z.enum(["heart", "fire", "clap", "star"]),
  }),

  delete: z.object({
    activityId: z.string().min(1, "Activity ID is required"),
  }),
};

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * ActivityFeedController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class ActivityFeedController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get activities for a trip
   */
  async getByTrip(input: unknown) {
    const parsed = schemas.getByTrip.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getActivityFeedUseCase({
      tripId: parsed.data.tripId,
      pageSize: parsed.data.pageSize,
      cursor: parsed.data.cursor,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Get a single activity by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: GetActivityByIdOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getActivityByIdUseCase({
      activityId: parsed.data.id as ActivityId,
    });

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a custom activity (admin created)
   */
  async createCustom(input: unknown) {
    const parsed = schemas.createCustom.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createActivityUseCase({
      tripId: parsed.data.tripId,
      activityType: "custom",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a user post activity
   */
  async createUserPost(input: unknown) {
    const parsed = schemas.createUserPost.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createActivityUseCase({
      tripId: parsed.data.tripId,
      activityType: "user_post",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      userPost: parsed.data.userPost,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a submission activity
   */
  async createSubmission(input: unknown) {
    const parsed = schemas.createSubmission.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createActivityUseCase({
      tripId: parsed.data.tripId,
      activityType: "submission",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
      submissionActivity: {
        ...parsed.data.submissionActivity,
        hasVideo: parsed.data.submissionActivity.hasVideo ?? false,
        isWinner: parsed.data.submissionActivity.isWinner ?? null,
        ranking: parsed.data.submissionActivity.ranking ?? null,
        pointsAwarded: parsed.data.submissionActivity.pointsAwarded ?? null,
        currentGroupRank: null,
      },
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a challenge event activity
   */
  async createChallengeEvent(input: unknown) {
    const parsed = schemas.createChallengeEvent.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createActivityUseCase({
      tripId: parsed.data.tripId,
      activityType: "challenge_event",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
      challengeActivity: parsed.data.challengeActivity,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a rank change activity
   */
  async createRankChange(input: unknown) {
    const parsed = schemas.createRankChange.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createActivityUseCase({
      tripId: parsed.data.tripId,
      activityType: "rank_change",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
      rankChangeActivity: parsed.data.rankChangeActivity,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Update an activity
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: UpdateActivityOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.update.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateActivityUseCase({
      activityId: parsed.data.activityId as ActivityId,
      title: parsed.data.title,
      description: parsed.data.description,
    });

    const result = await runWithLayer(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Activity not found" };
      }
    }

    return result;
  }

  /**
   * Pin/unpin an activity
   */
  async setPinned(input: unknown): Promise<
    | {
        success: true;
        data: UpdateActivityOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.setPinned.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateActivityUseCase({
      activityId: parsed.data.activityId as ActivityId,
      isPinned: parsed.data.isPinned,
    });

    const result = await runWithLayer(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Activity not found" };
      }
    }

    return result;
  }

  /**
   * Hide an activity
   */
  async hide(input: unknown): Promise<
    | {
        success: true;
        data: HideActivityOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.hide.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = hideActivityUseCase({
      activityId: parsed.data.activityId as ActivityId,
      hiddenByAdmin: parsed.data.hiddenByAdmin,
      reason: parsed.data.reason ?? null,
    });

    const result = await runWithLayer(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Activity not found" };
      }
    }

    return result;
  }

  /**
   * Unhide an activity
   */
  async unhide(input: unknown): Promise<
    | {
        success: true;
        data: UnhideActivityOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.unhide.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = unhideActivityUseCase({
      activityId: parsed.data.activityId as ActivityId,
    });

    const result = await runWithLayer(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Activity not found" };
      }
    }

    return result;
  }

  /**
   * Toggle a reaction on an activity
   */
  async toggleReaction(input: unknown) {
    const parsed = schemas.addReaction.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = addReactionUseCase({
      activityId: parsed.data.activityId as ActivityId,
      userId: parsed.data.userId,
      reactionType: parsed.data.reactionType,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Delete an activity
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { success: boolean } }
    | { success: false; error: string }
  > {
    const parsed = schemas.delete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteActivityUseCase({
      activityId: parsed.data.activityId as ActivityId,
    });

    const result = await runWithLayer(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Activity not found" };
      }
    }

    if (result.success) {
      return { success: true, data: { success: true } };
    }

    return result;
  }
}
