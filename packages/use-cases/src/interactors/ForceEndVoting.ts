import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Input for ForceEndVoting use case
 */
export interface ForceEndVotingInput {
  challengeId: string;
  tripId: string;
  adminId: string;
}

/**
 * Output DTO for ForceEndVoting use case
 */
export interface ForceEndVotingOutput {
  success: boolean;
  finalized: boolean;
  challengeId: string;
  challengeStatus: "COMPLETED";
  totalVotes: number;
}

/**
 * ForceEndVoting Use Case
 *
 * Forces the end of voting for a judged staff challenge.
 * This is an administrative action that:
 * - Validates the challenge is eligible for forced completion
 * - Recomputes all submission vote scores
 * - Marks the challenge as completed
 */
export class ForceEndVotingUseCase {
  constructor(
    private voteRepository: ChallengeVoteRepository,
    private challengeRepository: {
      findById(id: string): Promise<{
        id: string;
        tripId: string;
        status: string;
        scoringCategory: string;
        endTime: Date | null;
      } | null>;
      updateStatus(id: string, status: string): Promise<void>;
    },
    private submissionRepository: {
      findByChallengeId(challengeId: string): Promise<
        Array<{
          id: string;
          challengeId: string;
          status: string;
        }>
      >;
      updateVoteStats(
        submissionId: string,
        stats: { voteCount: number; voteScore: number },
      ): Promise<void>;
    },
    private onChallengeCompleted?: (params: {
      challengeId: string;
      tripId: string;
      adminId: string;
    }) => Promise<void>,
  ) {}

  async execute(
    input: ForceEndVotingInput,
  ): Promise<Result<ForceEndVotingOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    if (!input.tripId || input.tripId.trim() === "") {
      return err("tripId is required");
    }

    if (!input.adminId || input.adminId.trim() === "") {
      return err("adminId is required");
    }

    // Fetch challenge
    const challenge = await this.challengeRepository.findById(
      input.challengeId,
    );
    if (!challenge) {
      return err("Challenge not found");
    }

    // Validate challenge is in correct trip
    if (challenge.tripId !== input.tripId) {
      return err("Challenge not found in trip");
    }

    // Validate it's a judged staff challenge
    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      return err("Force end is available only for judged staff challenges");
    }

    // Validate challenge is not already cancelled or completed
    if (challenge.status === "CANCELLED") {
      return err("Cancelled challenge cannot be finalized");
    }

    if (challenge.status === "COMPLETED") {
      // Already completed, treat as success but not finalized
      const votes = await this.voteRepository.findByChallengeId(
        input.challengeId,
      );
      return ok({
        success: true,
        finalized: false,
        challengeId: input.challengeId,
        challengeStatus: "COMPLETED",
        totalVotes: votes.length,
      });
    }

    // Validate submission phase has ended
    if (!challenge.endTime) {
      return err("Staff voting requires submission end time");
    }

    const now = new Date();
    if (challenge.endTime.getTime() > now.getTime()) {
      return err(
        "You can force end staff voting only after submission phase ends",
      );
    }

    // Recompute submission vote scores
    await this.recomputeSubmissionVotes(input.challengeId);

    // Update challenge status to COMPLETED
    await this.challengeRepository.updateStatus(input.challengeId, "COMPLETED");

    // Trigger completion callback if provided (for activity feed, etc.)
    if (this.onChallengeCompleted) {
      await this.onChallengeCompleted({
        challengeId: input.challengeId,
        tripId: input.tripId,
        adminId: input.adminId,
      });
    }

    const votes = await this.voteRepository.findByChallengeId(
      input.challengeId,
    );

    return ok({
      success: true,
      finalized: true,
      challengeId: input.challengeId,
      challengeStatus: "COMPLETED",
      totalVotes: votes.length,
    });
  }

  private async recomputeSubmissionVotes(challengeId: string): Promise<void> {
    // Get all submissions for this challenge
    const submissions =
      await this.submissionRepository.findByChallengeId(challengeId);

    // Get all votes
    const votes = await this.voteRepository.findByChallengeId(challengeId);

    // Calculate vote stats per submission
    const tally = new Map<string, { count: number; score: number }>();
    for (const vote of votes) {
      const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
      current.count += 1;
      current.score += vote.getWeightedScore();
      tally.set(vote.submissionId, current);
    }

    // Update each submission with computed stats
    for (const submission of submissions) {
      const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
      await this.submissionRepository.updateVoteStats(submission.id, {
        voteCount: stats.count,
        voteScore: stats.score,
      });
    }
  }
}
