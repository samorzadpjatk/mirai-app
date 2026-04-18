import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeId } from "@mirai-app/domain";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";

/**
 * Input for GetVotesByChallengeUseCase
 */
export interface GetVotesByChallengeInput {
  challengeId: string;
}

/**
 * Get Votes By Challenge Use Case
 *
 * Retrieves all votes for a challenge (admin/moderator view).
 */
export class GetVotesByChallengeUseCase {
  execute(input: GetVotesByChallengeInput) {
    return Effect.gen(function* () {
      const votePort = yield* ChallengeVotePortTag;

      // Convert string ID to branded ID
      const challengeId = ChallengeId.create(input.challengeId);

      // Get all votes
      const votes = yield* votePort.findByChallengeId(challengeId);

      // Map to DTOs
      return votes.map(
        (vote): ChallengeVoteDTO => ({
          id: vote.id,
          submissionId: vote.submissionId,
          userId: vote.voterId,
          score: vote.votePoints * vote.normalizedWeight,
          createdAt: vote.votedAt,
          updatedAt: vote.votedAt,
        }),
      );
    });
  }
}
