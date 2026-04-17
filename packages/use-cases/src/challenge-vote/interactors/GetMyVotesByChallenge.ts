import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import {
  ChallengeVotePort,
  type ChallengeVote,
} from "../ports/ChallengeVotePort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";

/**
 * Input for GetMyVotesByChallengeUseCase
 */
export interface GetMyVotesByChallengeInput {
  challengeId: string;
  tripId: string;
  userId: string;
}

/**
 * Get My Votes By Challenge Use Case
 *
 * Retrieves the current user's votes for a challenge.
 */
export class GetMyVotesByChallengeUseCase {
  execute(
    input: GetMyVotesByChallengeInput,
  ): Effect.Effect<
    ChallengeVoteDTO[],
    ApplicationError,
    ChallengeVotePort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const votePort = yield* ChallengeVotePort;
      const participantPort = yield* TripParticipantPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return [];
      }

      // Get votes
      const votes = yield* votePort.findByChallengeAndVoter(
        input.challengeId,
        participant.id,
      );

      // Map to DTOs
      return votes.map(
        (vote): ChallengeVoteDTO => ({
          id: vote.id,
          submissionId: vote.submissionId,
          userId: participant.id,
          score: vote.votePoints * vote.normalizedWeight,
          createdAt: vote.votedAt,
          updatedAt: vote.votedAt,
        }),
      );
    });
  }
}
