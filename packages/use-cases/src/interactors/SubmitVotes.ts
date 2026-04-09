import { ChallengeVote, validateVoteSet } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";
import {
  UseCaseConflictError,
  UseCaseValidationError,
  UseCaseRepositoryError,
} from "../errors";

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
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new SubmitVotesUseCase(voteRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("submitVotesUseCase");
 * ```
 */
export class SubmitVotesUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(input: SubmitVotesInput): Promise<SubmitVotesOutput> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      throw new UseCaseValidationError({
        field: "challengeId",
        message: "challengeId is required",
      });
    }

    if (!input.voterId || input.voterId.trim() === "") {
      throw new UseCaseValidationError({
        field: "voterId",
        message: "voterId is required",
      });
    }

    if (!input.votes || input.votes.length === 0) {
      throw new UseCaseValidationError({
        field: "votes",
        message: "at least one vote is required",
      });
    }

    // Check if voter has already voted
    let hasVoted: boolean;
    try {
      hasVoted = await this.voteRepository.hasVoted(
        input.challengeId,
        input.voterId,
      );
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "SubmitVotes.hasVoted",
        message: "Failed to check if user has voted",
        cause,
      });
    }

    if (hasVoted) {
      throw new UseCaseConflictError({
        entity: "Vote",
        message: "You have already voted in this challenge",
      });
    }

    // Validate vote set (pure validation - no async)
    const validation = validateVoteSet(
      input.votes.map((v) => ({
        submissionId: v.submissionId,
        position: v.position,
      })),
      input.requiredPositions,
    );

    if (!validation.isValid) {
      throw new UseCaseValidationError({
        field: "votes",
        message: validation.error ?? "Invalid vote set",
      });
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
        throw new UseCaseValidationError({
          field: "vote",
          message: `Failed to create vote: ${voteResult.error}`,
        });
      }

      voteEntities.push(voteResult.value);
    }

    // Persist votes
    let savedVotes: ChallengeVote[];
    try {
      savedVotes = await this.voteRepository.createMany(voteEntities);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "SubmitVotes.createMany",
        message: "Failed to save votes",
        cause,
      });
    }

    return {
      votes: savedVotes.map((v) => this.toOutput(v)),
      totalVotesCast: savedVotes.length,
    };
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
