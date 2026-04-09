import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Input for GetVotesByChallenge use case
 */
export interface GetVotesByChallengeInput {
  challengeId: string;
}

/**
 * Output vote DTO
 */
export interface ChallengeVoteDTO {
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
 * Output DTO for GetVotesByChallenge use case
 */
export interface GetVotesByChallengeOutput {
  votes: ChallengeVoteDTO[];
  totalVotes: number;
  uniqueVoters: number;
}

/**
 * GetVotesByChallenge Use Case
 *
 * Retrieves all votes for a specific challenge.
 * Typically used by moderators/admins to view voting results.
 */
export class GetVotesByChallengeUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: GetVotesByChallengeInput,
  ): Promise<Result<GetVotesByChallengeOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    // Fetch all votes
    const votes = await this.voteRepository.findByChallengeId(
      input.challengeId,
    );

    // Sort by voterId then position
    const sortedVotes = [...votes].sort((a, b) => {
      if (a.voterId !== b.voterId) {
        return a.voterId.localeCompare(b.voterId);
      }
      return a.position.value - b.position.value;
    });

    // Count unique voters
    const uniqueVoterIds = new Set(votes.map((v) => v.voterId));

    return ok({
      votes: sortedVotes.map((v) => this.toDTO(v)),
      totalVotes: sortedVotes.length,
      uniqueVoters: uniqueVoterIds.size,
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
  }): ChallengeVoteDTO {
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
