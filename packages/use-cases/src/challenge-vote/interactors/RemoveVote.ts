import { Effect, Data } from "effect";
import {
  ChallengeId,
  ChallengeSubmissionId,
  ChallengeVoteId,
  TripId,
  UserId,
} from "@mirai-app/domain";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import {
  VoteNotFoundError,
  VotingNotActiveError,
} from "../errors/VoteErrors";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";

/**
 * Input for RemoveVoteUseCase
 */
export interface RemoveVoteInput {
  submissionId: string;
  tripId: string;
  challengeId: string;
  userId: string;
}

/**
 * Remove Vote Use Case
 *
 * Removes a user's vote from a specific submission. Users can only remove their own votes
 * and only while voting is still active.
 */
export class RemoveVoteUseCase {
  execute(input: RemoveVoteInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const votePort = yield* ChallengeVotePortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Convert string IDs to branded IDs
      const challengeId = ChallengeId.create(input.challengeId);
      const tripId = TripId.create(input.tripId);
      const userId = UserId.create(input.userId);
      const submissionId = ChallengeSubmissionId.create(input.submissionId);

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new VoteNotFoundError({
            voteId: input.submissionId,
          }),
        );
      }

      // Get challenge to check voting status
      const challenge = yield* challengePort.findById(challengeId);

      if (!challenge) {
        return yield* Effect.fail(
          new VoteNotFoundError({
            voteId: input.submissionId,
          }),
        );
      }

      // Validate challenge is still in voting state
      if (challenge.scoringCategory === "PEER_VOTING") {
        if (challenge.status !== "VOTING_PHASE") {
          return yield* Effect.fail(
            new VotingNotActiveError({
              challengeId: challenge.id,
              currentStatus: challenge.status,
            }),
          );
        }
      } else if (challenge.scoringCategory === "JUDGED_STAFF") {
        if (
          challenge.status !== "ACTIVE" &&
          challenge.status !== "VOTING_PHASE"
        ) {
          return yield* Effect.fail(
            new VotingNotActiveError({
              challengeId: challenge.id,
              currentStatus: challenge.status,
            }),
          );
        }
      }

      // Find the user's vote for this submission
      const votes = yield* votePort.findByChallengeAndVoter(
        challengeId,
        userId,
      );

      const vote = votes.find((v) =>
        v.submissionId === submissionId,
      );

      if (!vote) {
        return yield* Effect.fail(
          new VoteNotFoundError({
            voteId: input.submissionId,
          }),
        );
      }

      // Delete the vote
      yield* votePort.delete(vote.id);

      // Return the removed vote info
      return {
        id: vote.id,
        submissionId: vote.submissionId,
        userId: vote.voterId,
        score: 0, // Score is now 0 since vote is removed
        updatedAt: new Date(),
      };
    });
  }
}
