import { ActivityFeed, ValidationError } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";

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
 * Error types for CreateActivity use case
 */
export class ActivityCreationError extends Data.TaggedError(
  "ActivityCreationError",
)<{ message: string }> {}

export class ActivityRepositoryError extends Data.TaggedError(
  "ActivityRepositoryError",
)<{ message: string }> {}

/**
 * CreateActivity Use Case
 *
 * Creates a new activity in the feed.
 * Validates that the trip exists.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createActivityUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ActivityFeedRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createActivityUseCase(
  input: CreateActivityInput,
): Effect.Effect<
  CreateActivityOutput,
  ActivityCreationError | ActivityRepositoryError,
  ActivityFeedRepositoryTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedRepositoryTag;

    // Create domain entity using Effect-based static create method
    const activity = yield* ActivityFeed.create({
      tripId: input.tripId,
      activityType: input.activityType,
      title: input.title,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
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
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ActivityCreationError({
            message: validationError.message,
          }),
      ),
    );

    // Save to repository
    const saved = yield* activityRepo.create(activity).pipe(
      Effect.mapError(
        () =>
          new ActivityRepositoryError({
            message: "Failed to create activity",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(activity: ActivityFeed): CreateActivityOutput {
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
