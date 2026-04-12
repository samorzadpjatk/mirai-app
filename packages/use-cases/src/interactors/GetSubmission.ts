import { SubmissionId } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

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
  // Related info (populated if available)
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
}

/**
 * Error types for GetSubmission use case
 */
export class SubmissionNotFoundError extends Error {
  readonly _tag = "SubmissionNotFoundError";
  constructor(message: string = "Submission not found") {
    super(message);
  }
}

export class GetSubmissionRepositoryError extends Error {
  readonly _tag = "GetSubmissionRepositoryError";
  constructor(message: string = "Failed to get submission") {
    super(message);
  }
}

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
 *   Effect.provideService(ChallengeSubmissionRepositoryTag, repository)
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
  ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Find submission by ID
    const submission = yield* submissionRepo
      .findById(input.submissionId)
      .pipe(
        Effect.mapError(
          () => new GetSubmissionRepositoryError("Failed to get submission"),
        ),
      );

    if (!submission) {
      return yield* Effect.fail(new SubmissionNotFoundError());
    }

    return toOutput(submission);
  });
}

function toOutput(submission: {
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
}): GetSubmissionOutput {
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
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    group: submission.group,
    reviewedBy: submission.reviewedBy,
  };
}
