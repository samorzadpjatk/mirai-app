import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";
import { AppError } from "../errors";

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
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new ForceEndVotingUseCase(
 *   voteRepo,
 *   challengeRepo,
 *   submissionRepo,
 *   onChallengeCompleted
 * );
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("forceEndVotingUseCase");
 * ```
 */
export class ForceEndVotingUseCase {
  constructor(
    private voteRepository: ChallengeVoteRepository,
    private challengeRepository: ChallengeRepository,
    private submissionRepository: ChallengeSubmissionRepository,
    private onChallengeCompleted?: (params: {
      challengeId: string;
      tripId: string;
      adminId: string;
    }) => Promise<void>,
  ) {}

  async execute(input: ForceEndVotingInput): Promise<ForceEndVotingOutput> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      throw AppError.validation({
        field: "challengeId",
        message: "challengeId is required",
      });
    }

    if (!input.tripId || input.tripId.trim() === "") {
      throw AppError.validation({
        field: "tripId",
        message: "tripId is required",
      });
    }

    if (!input.adminId || input.adminId.trim() === "") {
      throw AppError.validation({
        field: "adminId",
        message: "adminId is required",
      });
    }

    // Fetch challenge
    let challenge: import("@mirai-app/domain").Challenge | null;
    try {
      challenge = await this.challengeRepository.findById(input.challengeId);
    } catch (cause) {
      throw AppError.repository({
        operation: "ForceEndVoting.findById",
        message: "Failed to load challenge",
        cause,
      });
    }

    if (!challenge) {
      throw AppError.notFound({
        entity: "Challenge",
        message: "Challenge not found",
      });
    }

    // Validate challenge is in correct trip
    if (challenge.tripId !== input.tripId) {
      throw AppError.notFound({
        entity: "Challenge",
        message: "Challenge not found in trip",
      });
    }

    // Validate it's a judged staff challenge
    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      throw AppError.conflict({
        entity: "Challenge",
        message: "Force end is available only for judged staff challenges",
      });
    }

    // Validate challenge is not already cancelled or completed
    if (challenge.status === "CANCELLED") {
      throw AppError.conflict({
        entity: "Challenge",
        message: "Cancelled challenge cannot be finalized",
      });
    }

    // Get votes for counting
    let votes: import("@mirai-app/domain").ChallengeVote[];
    try {
      votes = await this.voteRepository.findByChallengeId(input.challengeId);
    } catch (cause) {
      throw AppError.repository({
        operation: "ForceEndVoting.findByChallengeId",
        message: "Failed to load votes",
        cause,
      });
    }

    if (challenge.status === "COMPLETED") {
      // Already completed, treat as success but not finalized
      return {
        success: true,
        finalized: false,
        challengeId: input.challengeId,
        challengeStatus: "COMPLETED" as const,
        totalVotes: votes.length,
      };
    }

    // Validate submission phase has ended
    if (!challenge.endTime) {
      throw AppError.validation({
        field: "endTime",
        message: "Staff voting requires submission end time",
      });
    }

    const now = new Date();
    if (challenge.endTime.getTime() > now.getTime()) {
      throw AppError.conflict({
        entity: "Challenge",
        message:
          "You can force end staff voting only after submission phase ends",
      });
    }

    // Recompute submission vote scores
    try {
      await recomputeSubmissionVotes(
        this.submissionRepository,
        this.voteRepository,
        input.challengeId,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "ForceEndVoting.recomputeSubmissionVotes",
        message: "Failed to recompute submission votes",
        cause,
      });
    }

    // Update challenge status to COMPLETED
    try {
      await this.challengeRepository.updateStatus(
        input.challengeId,
        "COMPLETED",
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "ForceEndVoting.updateStatus",
        message: "Failed to update challenge status",
        cause,
      });
    }

    // Trigger completion callback if provided (for activity feed, etc.)
    if (this.onChallengeCompleted) {
      try {
        await this.onChallengeCompleted({
          challengeId: input.challengeId,
          tripId: input.tripId,
          adminId: input.adminId,
        });
      } catch (cause) {
        throw AppError.repository({
          operation: "ForceEndVoting.onChallengeCompleted",
          message: "Failed to trigger completion callback",
          cause,
        });
      }
    }

    return {
      success: true,
      finalized: true,
      challengeId: input.challengeId,
      challengeStatus: "COMPLETED" as const,
      totalVotes: votes.length,
    };
  }
}

// Helper function extracted for clarity and testability
async function recomputeSubmissionVotes(
  submissionRepository: ChallengeSubmissionRepository,
  voteRepository: ChallengeVoteRepository,
  challengeId: string,
): Promise<void> {
  // Get all submissions for this challenge
  const submissions = await submissionRepository.findByChallengeId(challengeId);

  // Get all votes
  const votes = await voteRepository.findByChallengeId(challengeId);

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
    const updated = submission.updateVoteStats({
      voteCount: stats.count,
      voteScore: stats.score,
    });
    await submissionRepository.update(updated);
  }
}
