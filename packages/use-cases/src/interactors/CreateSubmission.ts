import {
  ChallengeSubmission,
  SubmissionId,
  ValidationError,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for CreateSubmission use case
 */
export interface CreateSubmissionInput {
  challengeId: string;
  groupId: string;
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Output DTO for CreateSubmission use case
 */
export interface CreateSubmissionOutput {
  id: SubmissionId;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
}

/**
 * Error types for CreateSubmission use case
 */
export class SubmissionCreationError extends Error {
  readonly _tag = "SubmissionCreationError";
  constructor(message: string) {
    super(message);
  }
}

export class DuplicateSubmissionError extends Error {
  readonly _tag = "DuplicateSubmissionError";
  constructor(
    message: string = "Submission already exists for this challenge and group",
  ) {
    super(message);
  }
}

export class SubmissionRepositoryError extends Error {
  readonly _tag = "SubmissionRepositoryError";
  constructor(message: string = "Failed to create submission") {
    super(message);
  }
}

/**
 * CreateSubmission Use Case (Effect-based)
 *
 * Creates a new challenge submission for a group.
 * Returns error if submission already exists for this challenge and group.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createSubmissionUseCase(input);
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
export function createSubmissionUseCase(
  input: CreateSubmissionInput,
): Effect.Effect<
  CreateSubmissionOutput,
  | SubmissionCreationError
  | DuplicateSubmissionError
  | SubmissionRepositoryError,
  ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Check if submission already exists
    const exists = yield* submissionRepo.existsForChallengeAndGroup(
      input.challengeId,
      input.groupId,
    );

    if (exists) {
      return yield* Effect.fail(new DuplicateSubmissionError());
    }

    // Create domain entity using Effect-based static create method
    const submission = yield* ChallengeSubmission.create({
      challengeId: input.challengeId,
      groupId: input.groupId,
      ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
      ...(input.videoId !== undefined && { videoId: input.videoId }),
      ...(input.textContent !== undefined && {
        textContent: input.textContent,
      }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new SubmissionCreationError(validationError.message),
      ),
    );

    // Persist submission
    const saved = yield* submissionRepo
      .create(submission)
      .pipe(
        Effect.mapError(
          () => new SubmissionRepositoryError("Failed to create submission"),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(submission: ChallengeSubmission): CreateSubmissionOutput {
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
    awardedPoints: submission.awardedPoints,
    bonusPoints: submission.bonusPoints,
    ranking: submission.ranking,
    voteCount: submission.voteCount,
    voteScore: submission.voteScore,
    createdAt: submission.createdAt,
  };
}
