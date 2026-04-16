import { ChallengeStatus } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import type { ChallengeDTO } from "../dto";

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
 *   Effect.provideService(ChallengeGatewayTag, repository)
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
  ChallengeGatewayTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeGatewayTag;

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

function toOutput(challenge: ChallengeDTO): GetChallengeOutput {
  const isActive = challenge.status === ChallengeStatus.ACTIVE;
  const isOpenForSubmission =
    challenge.status === ChallengeStatus.VISIBLE ||
    challenge.status === ChallengeStatus.ACTIVE;
  const hasVotingPhase = challenge.scoringCategory === "PEER_VOTING";

  return {
    id: challenge.id,
    tripId: challenge.tripId,
    name: challenge.title,
    description: challenge.description,
    image: null, // Not in DTO
    submissionType: "TEXT", // Not in DTO, default value
    scoringCategory: challenge.scoringCategory,
    isRecurring: false, // Not in DTO, default value
    basePoints: challenge.points,
    status: challenge.status,
    startTime: challenge.startDate,
    endTime: challenge.endDate,
    targetLatitude: null, // Not in DTO
    targetLongitude: null, // Not in DTO
    expectedValue: null, // Not in DTO
    autoApprove: false, // Not in DTO, default value
    createdAt: challenge.createdAt,
    isActive,
    isOpenForSubmission,
    requiresLocation: false, // Not in DTO
    requiresQRCode: false, // Not in DTO
    hasVotingPhase,
  };
}
