import type { Result } from "@mirai-app/domain";
import { ok, err, ChallengeVote, calculateVoteStats } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

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
 * GetChallengeVotingProgress Use Case
 *
 * Retrieves the current voting progress for a challenge,
 * including vote counts and scores per submission.
 */
export class GetChallengeVotingProgressUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: GetChallengeVotingProgressInput,
  ): Promise<Result<GetChallengeVotingProgressOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    // Fetch all votes for the challenge
    const votes = await this.voteRepository.findByChallengeId(
      input.challengeId,
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

    return ok({
      challengeId: input.challengeId,
      totalVotes: votes.length,
      submissionStats,
    });
  }
}
