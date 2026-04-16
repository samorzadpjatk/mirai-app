import { SubmissionId, ValidationError } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";

/**
 * Input for CreateSubmission use case
 */
export interface CreateSubmissionInput {
  challengeId: string;
  userId: string;
  groupId?: string | null;
  content?: string | null;
  mediaUrls?: string[];
}

/**
 * Output DTO for CreateSubmission use case
 */
export interface CreateSubmissionOutput {
  id: SubmissionId;
  challengeId: string;
  userId: string;
  groupId: string | null;
  content: string | null;
  mediaUrls: string[];
  status: string;
  score: number | null;
  submittedAt: Date;
}

/**
 * Error types for CreateSubmission use case
 */
export class SubmissionCreationError extends Data.TaggedError(
  "SubmissionCreationError",
)<{
  message: string;
}> {}

export class DuplicateSubmissionError extends Data.TaggedError(
  "DuplicateSubmissionError",
)<{
  message: string;
}> {}

export class SubmissionRepositoryError extends Data.TaggedError(
  "SubmissionRepositoryError",
)<{
  message: string;
}> {}

/**
 * CreateSubmission Use Case (Effect-based)
 *
 * Creates a new challenge submission for a user/group.
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
 *   Effect.provideService(ChallengeSubmissionGatewayTag, repository)
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
  ChallengeSubmissionGatewayTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionGatewayTag;

    // Check if submission already exists (if groupId provided)
    if (input.groupId) {
      const exists = yield* submissionRepo.existsForChallengeAndGroup(
        input.challengeId,
        input.groupId,
      );

      if (exists) {
        return yield* Effect.fail(
          new DuplicateSubmissionError({
            message: "Submission already exists for this challenge and group",
          }),
        );
      }
    }

    // Create DTO directly
    const now = new Date();
    const submission: ChallengeSubmissionDTO = {
      id: crypto.randomUUID(),
      challengeId: input.challengeId,
      userId: input.userId,
      groupId: input.groupId ?? null,
      content: input.content ?? null,
      mediaUrls: input.mediaUrls ?? [],
      status: "PENDING",
      score: null,
      reviewedById: null,
      reviewedAt: null,
      reviewNotes: null,
      submittedAt: now,
      updatedAt: now,
    };

    // Persist submission
    const saved = yield* submissionRepo.create(submission).pipe(
      Effect.mapError(
        () =>
          new SubmissionRepositoryError({
            message: "Failed to create submission",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(submission: ChallengeSubmissionDTO): CreateSubmissionOutput {
  return {
    id: submission.id,
    challengeId: submission.challengeId,
    userId: submission.userId,
    groupId: submission.groupId,
    content: submission.content,
    mediaUrls: submission.mediaUrls,
    status: submission.status,
    score: submission.score,
    submittedAt: submission.submittedAt,
  };
}
