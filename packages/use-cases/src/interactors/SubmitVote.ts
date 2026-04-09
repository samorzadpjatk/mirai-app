import type { Result } from "@mirai-app/domain";
import { ok, err, ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Input for SubmitVote use case (single vote)
 */
export interface SubmitVoteInput {
  challengeId: string;
  submissionId: string;
  voterId: string;
  position: number;
  points?: number;
  normalizedWeight?: number;
  allowPartial?: boolean; // For judged staff: allow voting one position at a time
}

/**
 * Output DTO for SubmitVote use case
 */
export interface SubmitVoteOutput {
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
 * SubmitVote Use Case
 *
 * Submits a single vote for a challenge.
 * For peer voting: rejects if voter has already voted (any position).
 * For judged staff: allows partial voting (one position at a time).
 */
export class SubmitVoteUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: SubmitVoteInput,
  ): Promise<Result<SubmitVoteOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    if (!input.submissionId || input.submissionId.trim() === "") {
      return err("submissionId is required");
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return err("voterId is required");
    }

    // Validate position
    if (input.position < 1 || input.position > 3) {
      return err("position must be between 1 and 3");
    }

    // Check if voter has already voted for this position
    const hasVotedForPosition = await this.voteRepository.hasVotedForPosition(
      input.challengeId,
      input.voterId,
      input.position,
    );

    if (hasVotedForPosition) {
      return err("Vote position is already taken");
    }

    // For non-partial voting, check if voter has already voted at all
    if (!input.allowPartial) {
      const hasVoted = await this.voteRepository.hasVoted(
        input.challengeId,
        input.voterId,
      );
      if (hasVoted) {
        return err("You have already voted in this challenge");
      }
    }

    // Create domain entity
    const voteResult = ChallengeVote.create({
      challengeId: input.challengeId,
      submissionId: input.submissionId,
      voterId: input.voterId,
      position: input.position,
      ...(input.points !== undefined && { points: input.points }),
      ...(input.normalizedWeight !== undefined && {
        weight: input.normalizedWeight,
      }),
    });

    if (voteResult.kind === "err") {
      return err(`Failed to create vote: ${voteResult.error}`);
    }

    // Persist vote
    const savedVote = await this.voteRepository.create(voteResult.value);

    return ok(this.toOutput(savedVote));
  }

  private toOutput(vote: ChallengeVote): SubmitVoteOutput {
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
