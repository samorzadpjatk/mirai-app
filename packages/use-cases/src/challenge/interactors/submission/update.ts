import { SubmissionId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";

/**
 * Input for UpdateSubmission use case
 */
export interface UpdateSubmissionInput {
  submissionId: SubmissionId;
  // Content update fields (only allowed when PENDING)
  content?: string | null;
  mediaUrls?: string[];
  // Review fields (moderator only)
  reviewAction?: "APPROVE" | "REJECT";
  reviewedById?: string;
  reviewNotes?: string;
  score?: number;
}

/**
 * Output DTO for UpdateSubmission use case
 */
export interface UpdateSubmissionOutput {
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
  updatedAt: Date;
}

/**
 * Error types for UpdateSubmission use case
 */
export class SubmissionUpdateNotFoundError extends Data.TaggedError(
  "SubmissionUpdateNotFoundError",
)<{
  message: string;
}>() {}

export class SubmissionUpdateValidationError extends Data.TaggedError(
  "SubmissionUpdateValidationError",
)<{
  message: string;
}>() {}

export class InvalidReviewActionError extends Data.TaggedError(
  "InvalidReviewActionError",
)<{
  message: string;
}>() {}

export class UpdateSubmissionRepositoryError extends Data.TaggedError(
  "UpdateSubmissionRepositoryError",
)<{
  message: string;
}>() {}

/**
 * UpdateSubmission Use Case (Effect-based)
 *
 * Updates a submission's content (when pending) or reviews it (moderator action).
 * Returns error if submission not found or update not allowed.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateSubmissionUseCase(input);
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
export function updateSubmissionUseCase(
  input: UpdateSubmissionInput,
): Effect.Effect<
  UpdateSubmissionOutput,
  | SubmissionUpdateNotFoundError
  | SubmissionUpdateValidationError
  | InvalidReviewActionError
  | UpdateSubmissionRepositoryError,
  ChallengeSubmissionGatewayTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionGatewayTag;

    // Find existing submission
    const existing = yield* submissionRepo.findById(input.submissionId).pipe(
      Effect.mapError(
        () =>
          new UpdateSubmissionRepositoryError({
            message: "Failed to find submission",
          }),
      ),
    );

    if (!existing) {
      return yield* Effect.fail(
        new SubmissionUpdateNotFoundError({ message: "Submission not found" }),
      );
    }

    // Validate content updates only allowed when PENDING
    if (
      (input.content !== undefined || input.mediaUrls !== undefined) &&
      existing.status !== "PENDING"
    ) {
      return yield* Effect.fail(
        new SubmissionUpdateValidationError({
          message: "Cannot update content for non-pending submission",
        }),
      );
    }

    let updatedSubmission: ChallengeSubmissionDTO = { ...existing };

    // Handle review actions
    if (input.reviewAction) {
      const now = new Date();
      if (input.reviewAction === "APPROVE") {
        updatedSubmission = {
          ...updatedSubmission,
          status: "APPROVED",
          score: input.score ?? existing.score,
          reviewedById: input.reviewedById ?? null,
          reviewedAt: now,
          reviewNotes: input.reviewNotes ?? null,
          updatedAt: now,
        };
      } else if (input.reviewAction === "REJECT") {
        updatedSubmission = {
          ...updatedSubmission,
          status: "REJECTED",
          reviewedById: input.reviewedById ?? null,
          reviewedAt: now,
          reviewNotes: input.reviewNotes ?? null,
          updatedAt: now,
        };
      } else {
        return yield* Effect.fail(
          new InvalidReviewActionError({
            message: "Invalid review action",
          }),
        );
      }
    } else {
      // Handle content updates
      updatedSubmission = {
        ...updatedSubmission,
        ...(input.content !== undefined && { content: input.content }),
        ...(input.mediaUrls !== undefined && { mediaUrls: input.mediaUrls }),
        updatedAt: new Date(),
      };
    }

    // Persist updated submission
    const saved = yield* submissionRepo.update(updatedSubmission).pipe(
      Effect.mapError(
        () =>
          new UpdateSubmissionRepositoryError({
            message: "Failed to update submission",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(submission: ChallengeSubmissionDTO): UpdateSubmissionOutput {
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
    updatedAt: submission.updatedAt,
  };
}
