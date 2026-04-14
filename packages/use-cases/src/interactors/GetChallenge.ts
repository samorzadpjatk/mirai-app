import { Challenge } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";

/**
 * Input for GetChallenge use case
 */
export interface GetChallengeInput {
  challengeId: string;
}

/**
 * Output DTO for GetChallenge use case
 */
export interface GetChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  basePoints: number;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  isActive: boolean;
  isOpenForSubmission: boolean;
  requiresLocation: boolean;
  requiresQRCode: boolean;
  hasVotingPhase: boolean;
}

/**
 * Error types for GetChallenge use case
 */
export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{ message: string; challengeId?: string }> {}

export class ChallengeLoadError extends Data.TaggedError("ChallengeLoadError")<{
  message: string;
}> {}

/**
 * GetChallenge Use Case
 *
 * Retrieves a challenge by ID.
 * Returns error if challenge not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getChallengeUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getChallengeUseCase(
  input: GetChallengeInput,
): Effect.Effect<
  GetChallengeOutput,
  ChallengeNotFoundError | ChallengeLoadError,
  ChallengeRepositoryTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeRepositoryTag;

    // Load challenge
    const challenge = yield* challengeRepo
      .findById(input.challengeId)
      .pipe(
        Effect.mapError(
          () => new ChallengeLoadError({ message: "Failed to load challenge" }),
        ),
      );

    if (!challenge) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({
          message: "Challenge not found",
          challengeId: input.challengeId,
        }),
      );
    }

    return toOutput(challenge);
  });
}

function toOutput(challenge: Challenge): GetChallengeOutput {
  return {
    id: challenge.id,
    tripId: challenge.tripId,
    name: challenge.name,
    description: challenge.description,
    image: challenge.image,
    submissionType: challenge.submissionType,
    scoringCategory: challenge.scoringCategory,
    isRecurring: challenge.isRecurring,
    basePoints: challenge.basePoints,
    status: challenge.status,
    startTime: challenge.startTime,
    endTime: challenge.endTime,
    targetLatitude: challenge.targetLatitude,
    targetLongitude: challenge.targetLongitude,
    expectedValue: challenge.expectedValue,
    autoApprove: challenge.autoApprove,
    createdAt: challenge.createdAt,
    isActive: challenge.isActive(),
    isOpenForSubmission: challenge.isOpenForSubmission(),
    requiresLocation: challenge.requiresLocation(),
    requiresQRCode: challenge.requiresQRCode(),
    hasVotingPhase: challenge.hasVotingPhase(),
  };
}
