import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Input for GetMyVotes use case
 */
export interface GetMyVotesInput {
  challengeId: string;
  voterId: string;
}

/**
 * Output vote DTO
 */
export interface VoteDTO {
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
 * Output DTO for GetMyVotes use case
 */
export interface GetMyVotesOutput {
  votes: VoteDTO[];
  totalVotes: number;
}

/**
 * GetMyVotes Use Case
 *
 * Retrieves all votes cast by a specific voter in a challenge.
 */
export class GetMyVotesUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: GetMyVotesInput,
  ): Promise<Result<GetMyVotesOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return err("voterId is required");
    }

    // Fetch votes
    const votes = await this.voteRepository.findByChallengeAndVoter(
      input.challengeId,
      input.voterId,
    );

    // Sort by position
    const sortedVotes = [...votes].sort(
      (a, b) => a.position.value - b.position.value,
    );

    return ok({
      votes: sortedVotes.map((v) => this.toDTO(v)),
      totalVotes: sortedVotes.length,
    });
  }

  private toDTO(vote: {
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    position: { value: number };
    points: number;
    weight: { value: number };
    votedAt: Date;
  }): VoteDTO {
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
