import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeId, ChallengeSubmissionId, ChallengeVoteId, TripId, UserId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import {
  VotingNotActiveError,
  AlreadyVotedError,
  CannotVoteForOwnGroupError,
  InvalidSubmissionError,
  DuplicateVotePositionError,
  DuplicateSubmissionVoteError,
  AdminOnlyVotingError,
} from "../errors/VoteErrors";
import type { ChallengeVoteDTO } from "../dto/ChallengeVoteDTOs";
import type { ChallengeVote } from "@mirai-app/domain";

/**
 * Vote Input
 */
export interface VoteInput {
  submissionId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight?: number;
}

/**
 * Input for SubmitVotesUseCase
 */
export interface SubmitVotesInput {
  tripId: string;
  challengeId: string;
  userId: string;
  userRole: string;
  votes: VoteInput[];
}

/**
 * Submit Votes Use Case
 *
 * Submits multiple votes for a challenge.
 */
export class SubmitVotesUseCase {
  execute(input: SubmitVotesInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
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
        return yield* Effect.fail(
          new InvalidSubmissionError({
            submissionId: "",
            reason: "User is not a participant in this trip",
          }),
        );
      }

      // Get challenge
      const challenge = yield* challengePort.findById(challengeId);

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
        if (input.userRole !== "ADMIN") {
          return yield* Effect.fail(
            new AdminOnlyVotingError({
              challengeId: input.challengeId,
              userRole: input.userRole,
            }),
          );
        }
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

      // Check for existing votes
      const existingVotes = yield* votePort.findByChallengeAndVoter(
        challengeId,
        participant.userId,
      );

      if (existingVotes.length > 0) {
        return yield* Effect.fail(
          new AlreadyVotedError({
            challengeId: input.challengeId,
            voterId: participant.userId,
          }),
        );
      }

      // Validate unique positions and submissions
      const positions = new Set<number>();
      const submissionIds = new Set<string>();

      for (const vote of input.votes) {
        if (positions.has(vote.votePosition)) {
          return yield* Effect.fail(
            new DuplicateVotePositionError({ position: vote.votePosition }),
          );
        }
        positions.add(vote.votePosition);

        if (submissionIds.has(vote.submissionId)) {
          return yield* Effect.fail(
            new DuplicateSubmissionVoteError({ submissionId: vote.submissionId }),
          );
        }
        submissionIds.add(vote.submissionId);
      }

      // Validate submissions
      const submissions = yield* submissionPort.findByChallengeId(challengeId);
      const submissionMap = new Map(submissions.map((s) => [ChallengeSubmissionId.toString(s.id), s]));

      for (const vote of input.votes) {
        const submission = submissionMap.get(vote.submissionId);

        if (!submission) {
          return yield* Effect.fail(
            new InvalidSubmissionError({
              submissionId: vote.submissionId,
              reason: "Submission not found",
            }),
          );
        }

        if (participant.groupId && submission.groupId === participant.groupId) {
          return yield* Effect.fail(
            new CannotVoteForOwnGroupError({
              challengeId: input.challengeId,
              groupId: participant.groupId,
            }),
          );
        }
      }

      // Create votes
      const now = new Date();
      const votesToCreate: ChallengeVote[] = input.votes.map((vote) => ({
        id: ChallengeVoteId.generate(),
        challengeId: challengeId,
        submissionId: ChallengeSubmissionId.create(vote.submissionId),
        voterId: participant.userId,
        votePosition: vote.votePosition,
        votePoints: vote.votePoints,
        normalizedWeight: vote.normalizedWeight ?? 1.0,
        votedAt: now,
      }));

      const createdVotes = yield* votePort.createMany(votesToCreate);

      // Map to DTOs
      return createdVotes.map(
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
