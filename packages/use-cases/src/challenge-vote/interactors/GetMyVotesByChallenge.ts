import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeId, TripId, UserId } from "@mirai-app/domain";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";
import type { UserId as UserIdType } from "@mirai-app/domain";

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
  execute(input: GetMyVotesByChallengeInput) {
    return Effect.gen(function* () {
      const votePort = yield* ChallengeVotePortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Convert string IDs to branded IDs
      const challengeId = ChallengeId.create(input.challengeId);
      const tripId = TripId.create(input.tripId);
      const userId = UserId.create(input.userId);

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      if (!participant) {
        return [];
      }

      // Get votes
      const votes = yield* votePort.findByChallengeAndVoter(
        challengeId,
        participant.userId,
      );

      // Map to DTOs
      return votes.map(
        (vote): ChallengeVoteDTO => ({
          id: vote.id,
          submissionId: vote.submissionId,
          userId: participant.userId as UserIdType,
          score: vote.votePoints * vote.normalizedWeight,
          createdAt: vote.votedAt,
          updatedAt: vote.votedAt,
        }),
      );
    });
  }
}
