import { SubmissionId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";

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
    userId: string;
    groupId: string | null;
    content: string | null;
    mediaUrls: string[];
    status: string;
    score: number | null;
    reviewedById: string | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    submittedAt: Date;
    updatedAt: Date;
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
 *   Effect.provideService(ChallengeSubmissionGatewayTag, repository)
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
  ChallengeSubmissionGatewayTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionGatewayTag;

    // Fetch submissions using connection pattern with offset-based pagination
    // The offset is handled by calculating how many items to fetch and then slicing
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    // Fetch enough items to cover the offset + limit
    const connection = yield* submissionRepo
      .findManyConnection({
        challengeId: input.challengeId,
        orderBy: input.orderBy ?? "voteScore",
        orderDirection: input.orderDirection ?? "desc",
        first: offset + limit,
      })
      .pipe(
        Effect.mapError(
          () =>
            new ListSubmissionsRepositoryError({
              message: "Failed to fetch submissions",
            }),
        ),
      );

    // Extract submissions from connection, applying offset
    const submissions = connection.nodes.slice(offset, offset + limit);

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
        userId: submission.userId,
        groupId: submission.groupId,
        content: submission.content,
        mediaUrls: submission.mediaUrls,
        status: submission.status,
        score: submission.score,
        reviewedById: submission.reviewedById,
        reviewedAt: submission.reviewedAt,
        reviewNotes: submission.reviewNotes,
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt,
      })),
      totalCount,
    };
  });
}
