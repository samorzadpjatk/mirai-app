import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPort } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import {
  ChallengeVotePort,
  type ChallengeVote,
} from "../ports/ChallengeVotePort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import {
  VotingNotActiveError,
  AlreadyVotedError,
  CannotVoteForOwnGroupError,
  InvalidSubmissionError,
  VotePositionTakenError,
} from "../errors/VoteErrors";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";

/**
 * Input for SubmitVoteUseCase
 */
export interface SubmitVoteInput {
  tripId: string;
  challengeId: string;
  userId: string;
  userRole: string;
  submissionId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight?: number;
}

/**
 * Submit Vote Use Case
 *
 * Submits a single vote for a challenge.
 */
export class SubmitVoteUseCase {
  execute(
    input: SubmitVoteInput,
  ): Effect.Effect<
    ChallengeVoteDTO,
    | VotingNotActiveError
    | AlreadyVotedError
    | CannotVoteForOwnGroupError
    | InvalidSubmissionError
    | VotePositionTakenError
    | ApplicationError,
    | ChallengePortTag
    | ChallengeSubmissionPort
    | ChallengeVotePort
    | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const votePort = yield* ChallengeVotePort;
      const participantPort = yield* TripParticipantPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new InvalidSubmissionError({
            submissionId: "",
            reason: "User is not a participant in this trip",
          }),
        );
      }

      // Get challenge
      const challenge = yield* challengePort.findById(input.challengeId);

      if (!challenge) {
        return yield* Effect.fail(
          new InvalidSubmissionError({
            submissionId: input.challengeId,
            reason: "Challenge not found",
          }),
        );
      }

      // Validate challenge is in voting state
      if (challenge.scoringCategory === "PEER_VOTING") {
        if (challenge.status !== "VOTING_PHASE") {
          return yield* Effect.fail(
            new VotingNotActiveError({
              challengeId: input.challengeId,
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
              challengeId: input.challengeId,
              currentStatus: challenge.status,
            }),
          );
        }
      }

      // Get submission
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission || submission.challengeId !== input.challengeId) {
        return yield* Effect.fail(
          new InvalidSubmissionError({
            submissionId: input.submissionId,
            reason: "Submission not found",
          }),
        );
      }

      // Check for own group
      if (participant.groupId && submission.groupId === participant.groupId) {
        return yield* Effect.fail(
          new CannotVoteForOwnGroupError({
            challengeId: input.challengeId,
            groupId: participant.groupId,
          }),
        );
      }

      // Check for existing votes
      const existingVotes = yield* votePort.findByChallengeAndVoter(
        input.challengeId,
        participant.id,
      );

      // For peer voting, any existing vote blocks new votes
      if (
        existingVotes.length > 0 &&
        challenge.scoringCategory === "PEER_VOTING"
      ) {
        return yield* Effect.fail(
          new AlreadyVotedError({
            challengeId: input.challengeId,
            voterId: participant.id,
          }),
        );
      }

      // For judged staff, check if position is already taken
      const existingByPosition = existingVotes.find(
        (v) => v.votePosition === input.votePosition,
      );

      if (existingByPosition) {
        return yield* Effect.fail(
          new VotePositionTakenError({
            challengeId: input.challengeId,
            position: input.votePosition,
          }),
        );
      }

      // Create vote
      const now = new Date();
      const vote: ChallengeVote = {
        id: "", // Will be assigned by repository
        challengeId: input.challengeId,
        submissionId: input.submissionId,
        voterId: participant.id,
        votePosition: input.votePosition,
        votePoints: input.votePoints,
        normalizedWeight: input.normalizedWeight ?? 1.0,
        votedAt: now,
      };

      const createdVote = yield* votePort.create(vote);

      // Map to DTO
      return {
        id: createdVote.id,
        submissionId: createdVote.submissionId,
        userId: createdVote.voterId,
        score: createdVote.votePoints * createdVote.normalizedWeight,
        createdAt: createdVote.votedAt,
        updatedAt: createdVote.votedAt,
      };
    });
  }
}
