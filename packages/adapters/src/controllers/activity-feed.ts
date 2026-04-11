import { z } from "zod";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import {
  GetActivityFeedUseCase,
  CreateActivityUseCase,
  AddReactionUseCase,
  type CreateActivityInput,
  type AddReactionInput,
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
 * ActivityFeedController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class ActivityFeedController {
  constructor(private activityFeedRepository: ActivityFeedRepository) {}

  /**
   * Get activities for a trip
   */
  async getByTrip(input: unknown): Promise<
    | {
        success: true;
        data: {
          activities: Array<{
            id: string;
            tripId: string;
            activityType: string;
            title: string;
            description: string | null;
            imageUrl: string | null;
            isPinned: boolean;
            isHidden: boolean;
            createdAt: Date;
            updatedAt: Date;
            admin: {
              id: string;
              firstName: string;
              lastName: string;
            } | null;
          }>;
          nextCursor: {
            id: string;
            createdAt: Date;
            isPinned: boolean;
          } | null;
          pagination: {
            pageSize: number;
            hasMore: boolean;
          };
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByTrip.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetActivityFeedUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      pageSize: parsed.data.pageSize,
      cursor: parsed.data.cursor,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get a single activity by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
          admin: {
            id: string;
            firstName: string;
            lastName: string;
          } | null;
        };
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

    const activity = await this.activityFeedRepository.findById(
      parsed.data.id as ActivityId,
    );

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    return {
      success: true,
      data: {
        id: activity.id,
        tripId: activity.tripId,
        activityType: activity.activityType,
        title: activity.title,
        description: activity.description,
        imageUrl: activity.imageUrl,
        isPinned: activity.isPinned,
        isHidden: activity.isHidden,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        admin: activity.admin,
      },
    };
  }

  /**
   * Create a custom activity (admin created)
   */
  async createCustom(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.createCustom.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateActivityUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      activityType: "custom",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a user post activity
   */
  async createUserPost(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.createUserPost.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateActivityUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      activityType: "user_post",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      userPost: parsed.data.userPost,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a submission activity
   */
  async createSubmission(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.createSubmission.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateActivityUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
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

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a challenge event activity
   */
  async createChallengeEvent(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.createChallengeEvent.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateActivityUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      activityType: "challenge_event",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
      challengeActivity: parsed.data.challengeActivity,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a rank change activity
   */
  async createRankChange(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.createRankChange.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateActivityUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      activityType: "rank_change",
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isPinned: parsed.data.isPinned ?? false,
      createdByAdmin: parsed.data.createdByAdmin ?? null,
      rankChangeActivity: parsed.data.rankChangeActivity,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Update an activity
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          updatedAt: Date;
        };
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

    // Find existing activity
    const existing = await this.activityFeedRepository.findById(
      parsed.data.activityId as ActivityId,
    );

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    // Apply updates
    let updated = existing;

    if (
      parsed.data.title !== undefined ||
      parsed.data.description !== undefined
    ) {
      const contentResult = updated.updateContent({
        title: parsed.data.title,
        description: parsed.data.description,
      });

      if (contentResult.kind === "err") {
        return { success: false, error: contentResult.error.message };
      }

      updated = contentResult.value;
    }

    if (parsed.data.isPinned !== undefined) {
      updated = parsed.data.isPinned ? updated.pin() : updated.unpin();
    }

    // Persist changes
    const saved = await this.activityFeedRepository.update(updated);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        activityType: saved.activityType,
        title: saved.title,
        description: saved.description,
        imageUrl: saved.imageUrl,
        isPinned: saved.isPinned,
        isHidden: saved.isHidden,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Pin/unpin an activity
   */
  async setPinned(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const schema = z.object({
      activityId: z.string().min(1, "Activity ID is required"),
      isPinned: z.boolean(),
    });

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const existing = await this.activityFeedRepository.findById(
      parsed.data.activityId as ActivityId,
    );

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    const updated = parsed.data.isPinned ? existing.pin() : existing.unpin();

    const saved = await this.activityFeedRepository.update(updated);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        activityType: saved.activityType,
        title: saved.title,
        description: saved.description,
        imageUrl: saved.imageUrl,
        isPinned: saved.isPinned,
        isHidden: saved.isHidden,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Hide an activity
   */
  async hide(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          hiddenAt: Date;
          hiddenReason: string | null;
          updatedAt: Date;
        };
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

    const existing = await this.activityFeedRepository.findById(
      parsed.data.activityId as ActivityId,
    );

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    const updated = existing.hide(
      parsed.data.hiddenByAdmin,
      parsed.data.reason ?? null,
    );

    const saved = await this.activityFeedRepository.update(updated);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        activityType: saved.activityType,
        title: saved.title,
        description: saved.description,
        imageUrl: saved.imageUrl,
        isPinned: saved.isPinned,
        isHidden: saved.isHidden,
        hiddenAt: saved.hiddenAt!,
        hiddenReason: saved.hiddenReason,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Unhide an activity
   */
  async unhide(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          updatedAt: Date;
        };
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

    const existing = await this.activityFeedRepository.findById(
      parsed.data.activityId as ActivityId,
    );

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    const updated = existing.unhide();

    const saved = await this.activityFeedRepository.update(updated);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        activityType: saved.activityType,
        title: saved.title,
        description: saved.description,
        imageUrl: saved.imageUrl,
        isPinned: saved.isPinned,
        isHidden: saved.isHidden,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Toggle a reaction on an activity
   */
  async toggleReaction(input: unknown): Promise<
    | {
        success: true;
        data: {
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
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.addReaction.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new AddReactionUseCase(this.activityFeedRepository);
    const result = await useCase.execute({
      activityId: parsed.data.activityId as ActivityId,
      userId: parsed.data.userId,
      reactionType: parsed.data.reactionType,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const exists = await this.activityFeedRepository.exists(
      parsed.data.activityId as ActivityId,
    );

    if (!exists) {
      return { success: false, error: "Activity not found" };
    }

    await this.activityFeedRepository.delete(
      parsed.data.activityId as ActivityId,
    );

    return { success: true, data: { success: true } };
  }
}
