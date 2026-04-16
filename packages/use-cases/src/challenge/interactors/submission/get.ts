import { SubmissionId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";

/**
 * Input for GetSubmission use case
 */
export interface GetSubmissionInput {
  submissionId: SubmissionId;
}

/**
 * Output DTO for GetSubmission use case
 */
export interface GetSubmissionOutput {
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
}

/**
 * Error types for GetSubmission use case
 */
export class SubmissionNotFoundError extends Data.TaggedError(
  "SubmissionNotFoundError",
)<{
  message: string;
}>() {}

export class GetSubmissionRepositoryError extends Data.TaggedError(
  "GetSubmissionRepositoryError",
)<{
  message: string;
}>() {}

/**
 * GetSubmission Use Case (Effect-based)
 *
 * Retrieves a submission by ID.
 * Returns error if submission not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getSubmissionUseCase(input);
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
export function getSubmissionUseCase(
  input: GetSubmissionInput,
): Effect.Effect<
  GetSubmissionOutput,
  SubmissionNotFoundError | GetSubmissionRepositoryError,
  ChallengeSubmissionGatewayTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionGatewayTag;

    // Find submission by ID
    const submission = yield* submissionRepo.findById(input.submissionId).pipe(
      Effect.mapError(
        () =>
          new GetSubmissionRepositoryError({
            message: "Failed to get submission",
          }),
      ),
    );

    if (!submission) {
      return yield* Effect.fail(
        new SubmissionNotFoundError({ message: "Submission not found" }),
      );
    }

    return toOutput(submission);
  });
}

function toOutput(submission: ChallengeSubmissionDTO): GetSubmissionOutput {
  return {
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
  };
}
