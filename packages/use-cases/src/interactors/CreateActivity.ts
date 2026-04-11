import type { Result } from "@mirai-app/domain";
import { ok, err, ActivityFeed } from "@mirai-app/domain";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";

/**
 * Input for CreateActivity use case
 */
export interface CreateActivityInput {
  tripId: string;
  activityType:
    | "custom"
    | "user_post"
    | "submission"
    | "challenge_event"
    | "rank_change";
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPinned?: boolean;
  createdByAdmin?: string | null;
  // Type-specific metadata
  submissionActivity?: {
    submissionId: string;
    challengeId: string;
    groupId: string;
    hasVideo?: boolean;
    isWinner?: boolean | null;
    ranking?: number | null;
    pointsAwarded?: number | null;
    currentGroupRank?: number | null;
  } | null;
  challengeActivity?: {
    challengeId: string;
    eventType: "challenge_started" | "voting_started" | "completed";
    endTime?: Date | null;
    submissionType?: string | null;
    basePoints?: number | null;
    submissionCount?: number | null;
  } | null;
  rankChangeActivity?: {
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
  } | null;
  userPost?: {
    authorId: string;
    authorUserId: string;
    authorFirstName: string;
    authorLastName: string;
    authorHasAvatar: boolean;
    groupId: string | null;
    groupName: string | null;
    additionalImages: string[];
  } | null;
}

/**
 * Output DTO for CreateActivity use case
 */
export interface CreateActivityOutput {
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
}

/**
 * CreateActivity Use Case
 *
 * Creates a new activity in the feed.
 * Validates that the trip exists.
 */
export class CreateActivityUseCase {
  constructor(private activityFeedRepository: ActivityFeedRepository) {}

  async execute(
    input: CreateActivityInput,
  ): Promise<Result<CreateActivityOutput, string>> {
    // Create domain entity
    const activityResult = ActivityFeed.create({
      tripId: input.tripId,
      activityType: input.activityType,
      title: input.title,
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      isPinned: input.isPinned ?? false,
      createdByAdmin: input.createdByAdmin ?? null,
      submissionActivity: input.submissionActivity
        ? {
            submissionId: input.submissionActivity.submissionId,
            challengeId: input.submissionActivity.challengeId,
            groupId: input.submissionActivity.groupId,
            hasVideo: input.submissionActivity.hasVideo ?? false,
            isWinner: input.submissionActivity.isWinner ?? null,
            ranking: input.submissionActivity.ranking ?? null,
            pointsAwarded: input.submissionActivity.pointsAwarded ?? null,
            currentGroupRank: input.submissionActivity.currentGroupRank ?? null,
          }
        : null,
      challengeActivity: input.challengeActivity
        ? {
            challengeId: input.challengeActivity.challengeId,
            eventType: input.challengeActivity.eventType,
            endTime: input.challengeActivity.endTime ?? null,
            submissionType: input.challengeActivity.submissionType ?? null,
            basePoints: input.challengeActivity.basePoints ?? null,
            submissionCount: input.challengeActivity.submissionCount ?? null,
          }
        : null,
      rankChangeActivity: input.rankChangeActivity ?? null,
      userPost: input.userPost ?? null,
    });

    if (activityResult.kind === "err") {
      return err(activityResult.error.message);
    }

    // Persist activity
    const saved = await this.activityFeedRepository.create(
      activityResult.value,
    );

    return ok(this.toOutput(saved));
  }

  private toOutput(activity: ActivityFeed): CreateActivityOutput {
    return {
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
    };
  }
}
