import { Data, Effect } from "effect";
import { ChallengeVote } from "@mirai-app/domain";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for GetChallengeVotingProgress use case
 */
export interface GetChallengeVotingProgressInput {
  challengeId: string;
}

/**
 * Vote count per submission
 */
export interface SubmissionVoteCount {
  submissionId: string;
  voteCount: number;
  voteScore: number;
}

/**
 * Output DTO for GetChallengeVotingProgress use case
 */
export interface GetChallengeVotingProgressOutput {
  challengeId: string;
  totalVotes: number;
  submissionStats: SubmissionVoteCount[];
}

/**
 * Error types for GetChallengeVotingProgress use case
 */
export class GetVotingProgressValidationError extends Data.TaggedError(
  "GetVotingProgressValidationError",
)<{
  message: string;
}> {}

export class GetVotingProgressRepositoryError extends Data.TaggedError(
  "GetVotingProgressRepositoryError",
)<{
  message: string;
}> {}

/**
 * GetChallengeVotingProgress Use Case (Effect-based)
 *
 * Retrieves the current voting progress for a challenge,
 * including vote counts and scores per submission.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getChallengeVotingProgressUseCase(input);
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getChallengeVotingProgressUseCase(
  input: GetChallengeVotingProgressInput,
): Effect.Effect<
  GetChallengeVotingProgressOutput,
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

    // Fetch all votes for the challenge
    const votes = yield* voteRepo.findByChallengeId(input.challengeId).pipe(
      Effect.mapError(
        () =>
          new GetVotingProgressRepositoryError({
            message: "Failed to retrieve voting progress",
          }),
      ),
    );

    // Calculate stats per submission
    const submissionMap = new Map<string, { count: number; score: number }>();

    for (const vote of votes) {
      const current = submissionMap.get(vote.submissionId) ?? {
        count: 0,
        score: 0,
      };
      current.count += 1;
      current.score += vote.getWeightedScore();
      submissionMap.set(vote.submissionId, current);
    }

    const submissionStats: SubmissionVoteCount[] = Array.from(
      submissionMap.entries(),
    )
      .map(([submissionId, stats]) => ({
        submissionId,
        voteCount: stats.count,
        voteScore: stats.score,
      }))
      .sort((a, b) => b.voteScore - a.voteScore || b.voteCount - a.voteCount);

    return {
      challengeId: input.challengeId,
      totalVotes: votes.length,
      submissionStats,
    };
  });
}
