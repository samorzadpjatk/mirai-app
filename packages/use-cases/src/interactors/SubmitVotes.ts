import type { Result } from "@repo/domain";
import { ok, err, ChallengeVote, validateVoteSet } from "@repo/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Single vote input for batch submission
 */
export interface VoteInput {
  submissionId: string;
  position: number;
  points?: number;
  normalizedWeight?: number;
}

/**
 * Input for SubmitVotes use case
 */
export interface SubmitVotesInput {
  challengeId: string;
  voterId: string;
  votes: VoteInput[];
  requiredPositions: number;
}

/**
 * Output vote DTO
 */
export interface VoteOutput {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}

/**
 * Output DTO for SubmitVotes use case
 */
export interface SubmitVotesOutput {
  votes: VoteOutput[];
  totalVotesCast: number;
}

/**
 * SubmitVotes Use Case
 *
 * Submits multiple votes for a challenge in a single transaction.
 * Validates that:
 * - Voter hasn't already voted
 * - All positions are unique
 * - All submissions are unique
 * - Required positions are filled
 */
export class SubmitVotesUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: SubmitVotesInput,
  ): Promise<Result<SubmitVotesOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return err("voterId is required");
    }

    if (!input.votes || input.votes.length === 0) {
      return err("at least one vote is required");
    }

    // Check if voter has already voted
    const hasVoted = await this.voteRepository.hasVoted(
      input.challengeId,
      input.voterId,
    );
    if (hasVoted) {
      return err("You have already voted in this challenge");
    }

    // Validate vote set
    const validation = validateVoteSet(
      input.votes.map((v) => ({
        submissionId: v.submissionId,
        position: v.position,
      })),
      input.requiredPositions,
    );

    if (!validation.isValid) {
      return err(validation.error ?? "Invalid vote set");
    }

    // Create domain entities
    const voteEntities: ChallengeVote[] = [];
    for (const voteInput of input.votes) {
      const voteResult = ChallengeVote.create({
        challengeId: input.challengeId,
        submissionId: voteInput.submissionId,
        voterId: input.voterId,
        position: voteInput.position,
        ...(voteInput.points !== undefined && { points: voteInput.points }),
        ...(voteInput.normalizedWeight !== undefined && {
          weight: voteInput.normalizedWeight,
        }),
      });

      if (voteResult.kind === "err") {
        return err(`Failed to create vote: ${voteResult.error}`);
      }

      voteEntities.push(voteResult.value);
    }

    // Persist votes
    const savedVotes = await this.voteRepository.createMany(voteEntities);

    return ok({
      votes: savedVotes.map((v) => this.toOutput(v)),
      totalVotesCast: savedVotes.length,
    });
  }

  private toOutput(vote: ChallengeVote): VoteOutput {
    return {
      id: vote.id as string,
      challengeId: vote.challengeId,
      submissionId: vote.submissionId,
      voterId: vote.voterId,
      votePosition: vote.position.value,
      votePoints: vote.points,
      normalizedWeight: vote.weight.value,
      votedAt: vote.votedAt,
    };
  }
}
