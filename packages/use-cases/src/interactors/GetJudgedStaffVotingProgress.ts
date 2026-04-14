import { Effect, Data } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Admin voting progress info
 */
export interface AdminVotingInfo {
  participantId: string;
  votedPositions: number[];
  hasVotedAll: boolean;
}

/**
 * Input for GetJudgedStaffVotingProgress use case
 */
export interface GetJudgedStaffVotingProgressInput {
  challengeId: string;
  tripId: string;
  adminParticipantIds: string[];
  requiredPositions: number;
  eligibleSubmissionsCount: number;
}

/**
 * Output DTO for GetJudgedStaffVotingProgress use case
 */
export interface GetJudgedStaffVotingProgressOutput {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
  adminProgress: AdminVotingInfo[];
}

/**
 * Error when input validation fails
 */
export class GetVotingProgressValidationError extends Data.TaggedError(
  "GetVotingProgressValidationError",
)<{
  readonly message: string;
}> {}

/**
 * Error when repository operation fails
 */
export class GetVotingProgressRepositoryError extends Data.TaggedError(
  "GetVotingProgressRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

/**
 * GetJudgedStaffVotingProgress Use Case (Effect-based)
 *
 * Calculates the voting progress for judged staff challenges.
 * Tracks which admins have completed their required voting positions.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = getJudgedStaffVotingProgressUseCase(input).pipe(
 *   Effect.provideService(ChallengeVoteRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getJudgedStaffVotingProgressUseCase(
  input: GetJudgedStaffVotingProgressInput,
): Effect.Effect<
  GetJudgedStaffVotingProgressOutput,
  GetVotingProgressValidationError | GetVotingProgressRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new GetVotingProgressValidationError({
          message: "challengeId is required",
        }),
      );
    }

    if (!input.tripId || input.tripId.trim() === "") {
      return yield* Effect.fail(
        new GetVotingProgressValidationError({ message: "tripId is required" }),
      );
    }

    if (input.requiredPositions <= 0) {
      return yield* Effect.fail(
        new GetVotingProgressValidationError({
          message: "requiredPositions must be positive",
        }),
      );
    }

    const totalAdmins = input.adminParticipantIds.length;

    // Handle case with no admins
    if (totalAdmins === 0) {
      return {
        requiredPositions: input.requiredPositions,
        eligibleSubmissionsCount: input.eligibleSubmissionsCount,
        totalAdmins: 0,
        votedAdmins: 0,
        pendingAdmins: 0,
        allAdminsVoted: false,
        adminProgress: [],
      };
    }

    // Get voting progress for each admin
    const adminProgress: AdminVotingInfo[] = [];
    let votedAdmins = 0;

    for (const participantId of input.adminParticipantIds) {
      const votedPositions = yield* voteRepo
        .getVotedPositions(input.challengeId, participantId)
        .pipe(
          Effect.mapError(
            (err) =>
              new GetVotingProgressRepositoryError({
                operation: "get voted positions",
                cause: err,
              }),
          ),
        );

      // Check if all required positions are filled
      const hasVotedAll = hasAllRequiredPositions(
        votedPositions,
        input.requiredPositions,
      );

      if (hasVotedAll) {
        votedAdmins += 1;
      }

      adminProgress.push({
        participantId,
        votedPositions,
        hasVotedAll,
      });
    }

    const pendingAdmins = Math.max(totalAdmins - votedAdmins, 0);
    const allAdminsVoted =
      input.requiredPositions > 0 &&
      totalAdmins > 0 &&
      votedAdmins >= totalAdmins;

    return {
      requiredPositions: input.requiredPositions,
      eligibleSubmissionsCount: input.eligibleSubmissionsCount,
      totalAdmins,
      votedAdmins,
      pendingAdmins,
      allAdminsVoted,
      adminProgress,
    };
  });
}

function hasAllRequiredPositions(
  positions: number[],
  requiredPositions: number,
): boolean {
  if (requiredPositions <= 0) return false;

  const positionSet = new Set(positions);
  for (let position = 1; position <= requiredPositions; position += 1) {
    if (!positionSet.has(position)) {
      return false;
    }
  }

  return true;
}
