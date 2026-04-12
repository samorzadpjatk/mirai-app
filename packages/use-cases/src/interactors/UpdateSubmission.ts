import {
  ChallengeSubmission,
  SubmissionId,
  ValidationError,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for UpdateSubmission use case
 */
export interface UpdateSubmissionInput {
  submissionId: SubmissionId;
  // Content update fields (only allowed when PENDING)
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Review fields (moderator only)
  reviewAction?: "APPROVE" | "REJECT";
  reviewedById?: string;
  rejectionReason?: string;
  awardedPoints?: number;
  bonusPoints?: number;
  ranking?: number | null;
}

/**
 * Output DTO for UpdateSubmission use case
 */
export interface UpdateSubmissionOutput {
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
  updatedAt: Date;
}

/**
 * Error types for UpdateSubmission use case
 */
export class SubmissionUpdateNotFoundError extends Error {
  readonly _tag = "SubmissionUpdateNotFoundError";
  constructor(message: string = "Submission not found") {
    super(message);
  }
}

export class SubmissionUpdateValidationError extends Error {
  readonly _tag = "SubmissionUpdateValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class InvalidReviewActionError extends Error {
  readonly _tag = "InvalidReviewActionError";
  constructor(message: string = "Invalid review action") {
    super(message);
  }
}

export class UpdateSubmissionRepositoryError extends Error {
  readonly _tag = "UpdateSubmissionRepositoryError";
  constructor(message: string = "Failed to update submission") {
    super(message);
  }
}

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
 *   Effect.provideService(ChallengeSubmissionRepositoryTag, repository)
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
  ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Find existing submission
    const existing = yield* submissionRepo
      .findById(input.submissionId)
      .pipe(
        Effect.mapError(
          () =>
            new UpdateSubmissionRepositoryError("Failed to find submission"),
        ),
      );

    if (!existing) {
      return yield* Effect.fail(new SubmissionUpdateNotFoundError());
    }

    let updatedSubmission: ChallengeSubmission;

    // Handle review actions
    if (input.reviewAction) {
      if (input.reviewAction === "APPROVE") {
        const approved = yield* existing
          .approve({
            reviewedById: input.reviewedById ?? "",
            ...(input.awardedPoints !== undefined && {
              awardedPoints: input.awardedPoints,
            }),
            ...(input.bonusPoints !== undefined && {
              bonusPoints: input.bonusPoints,
            }),
            ...(input.ranking !== undefined && { ranking: input.ranking }),
          })
          .pipe(
            Effect.mapError(
              (validationError: ValidationError) =>
                new SubmissionUpdateValidationError(validationError.message),
            ),
          );
        updatedSubmission = approved;
      } else if (input.reviewAction === "REJECT") {
        const rejected = yield* existing
          .reject({
            reviewedById: input.reviewedById ?? "",
            reason: input.rejectionReason ?? "",
          })
          .pipe(
            Effect.mapError(
              (validationError: ValidationError) =>
                new SubmissionUpdateValidationError(validationError.message),
            ),
          );
        updatedSubmission = rejected;
      } else {
        return yield* Effect.fail(new InvalidReviewActionError());
      }
    } else {
      // Handle content updates
      const updated = yield* existing
        .updateContent({
          ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
          ...(input.videoId !== undefined && { videoId: input.videoId }),
          ...(input.textContent !== undefined && {
            textContent: input.textContent,
          }),
          ...(input.latitude !== undefined && { latitude: input.latitude }),
          ...(input.longitude !== undefined && { longitude: input.longitude }),
        })
        .pipe(
          Effect.mapError(
            (validationError: ValidationError) =>
              new SubmissionUpdateValidationError(validationError.message),
          ),
        );
      updatedSubmission = updated;
    }

    // Persist updated submission
    const saved = yield* submissionRepo
      .update(updatedSubmission)
      .pipe(
        Effect.mapError(
          () =>
            new UpdateSubmissionRepositoryError("Failed to update submission"),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(submission: ChallengeSubmission): UpdateSubmissionOutput {
  return {
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
    updatedAt: submission.updatedAt,
  };
}
