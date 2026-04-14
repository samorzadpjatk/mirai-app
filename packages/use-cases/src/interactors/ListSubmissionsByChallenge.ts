import { SubmissionId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for ListSubmissionsByChallenge use case
 */
export interface ListSubmissionsByChallengeInput {
  challengeId: string;
  orderBy?: "voteScore" | "createdAt";
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * Output DTO for ListSubmissionsByChallenge use case
 */
export interface ListSubmissionsByChallengeOutput {
  submissions: Array<{
    id: SubmissionId;
    challengeId: string;
    groupId: string;
    imageIds: string[];
    videoId: string | null;
    textContent: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    reviewedById: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    awardedPoints: number;
    bonusPoints: number;
    ranking: number | null;
    voteCount: number;
    voteScore: number;
    createdAt: Date;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
    reviewedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    } | null;
  }>;
  totalCount: number;
}

/**
 * Error types for ListSubmissionsByChallenge use case
 */
export class ListSubmissionsRepositoryError extends Data.TaggedError(
  "ListSubmissionsRepositoryError",
)<{
  message: string;
}> {}

/**
 * ListSubmissionsByChallenge Use Case (Effect-based)
 *
 * Lists all submissions for a challenge with pagination and sorting.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* listSubmissionsByChallengeUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeSubmissionRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function listSubmissionsByChallengeUseCase(
  input: ListSubmissionsByChallengeInput,
): Effect.Effect<
  ListSubmissionsByChallengeOutput,
  ListSubmissionsRepositoryError,
  ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Fetch submissions
    const submissions = yield* submissionRepo
      .findMany({
        challengeId: input.challengeId,
        orderBy: input.orderBy ?? "voteScore",
        orderDirection: input.orderDirection ?? "desc",
        ...(input.limit !== undefined && { limit: input.limit }),
        ...(input.offset !== undefined && { offset: input.offset }),
      })
      .pipe(
        Effect.mapError(
          () =>
            new ListSubmissionsRepositoryError({
              message: "Failed to fetch submissions",
            }),
        ),
      );

    // Count total
    const totalCount = yield* submissionRepo
      .countByChallengeId(input.challengeId)
      .pipe(
        Effect.mapError(
          () =>
            new ListSubmissionsRepositoryError({
              message: "Failed to count submissions",
            }),
        ),
      );

    return {
      submissions: submissions.map((submission) => ({
        id: submission.id,
        challengeId: submission.challengeId,
        groupId: submission.groupId,
        imageIds: submission.imageIds,
        videoId: submission.videoId,
        textContent: submission.textContent,
        latitude: submission.latitude,
        longitude: submission.longitude,
        status: submission.status,
        reviewedById: submission.reviewedById,
        reviewedAt: submission.reviewedAt,
        rejectionReason: submission.rejectionReason,
        awardedPoints: submission.awardedPoints,
        bonusPoints: submission.bonusPoints,
        ranking: submission.ranking,
        voteCount: submission.voteCount,
        voteScore: submission.voteScore,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        group: submission.group,
        reviewedBy: submission.reviewedBy,
      })),
      totalCount,
    };
  });
}
