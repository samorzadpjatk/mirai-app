import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeId, TripId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { NotJudgedStaffChallengeError } from "../errors/VoteErrors";

/**
 * Input for GetJudgedStaffProgressUseCase
 */
export interface GetJudgedStaffProgressInput {
  challengeId: string;
  tripId: string;
}

/**
 * Judged Staff Voting Progress Result
 */
export interface JudgedStaffProgressResult {
  challengeStatus: string;
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
}

/**
 * Get Judged Staff Voting Progress Use Case
 *
 * Gets the voting progress for judged staff challenges.
 */
export class GetJudgedStaffProgressUseCase {
  execute(input: GetJudgedStaffProgressInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const votePort = yield* ChallengeVotePortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Get challenge
      const challengeId = ChallengeId.create(input.challengeId);
      const tripId = TripId.create(input.tripId);
      const challenge = yield* challengePort.findById(challengeId);

      if (!challenge || challenge.scoringCategory !== "JUDGED_STAFF") {
        return yield* Effect.fail(
          new NotJudgedStaffChallengeError({
            challengeId: input.challengeId,
            scoringCategory: challenge?.scoringCategory ?? "UNKNOWN",
          }),
        );
      }

      // Get eligible submissions count (not rejected)
      const allSubmissions = yield* submissionPort.findByChallengeId(
        challengeId,
      );
      const eligibleSubmissions = allSubmissions.filter(
        (s) => s.status !== "REJECTED",
      );
      const eligibleSubmissionsCount = eligibleSubmissions.length;

      // Calculate required positions
      const requiredPositions =
        eligibleSubmissionsCount >= 2
          ? Math.min(3, eligibleSubmissionsCount)
          : 0;

      // Get admin participants
      const participants = yield* participantPort.findByTripId(tripId);
      // Filter for admin role would be done at adapter layer with user info
      const adminParticipants = participants; // Simplified - actual filter needs user role info

      // Get votes by admin participants
      const adminParticipantIds = adminParticipants.map((p) => p.userId);
      const allVotes = yield* votePort.findByChallengeId(challengeId);
      const adminVotes = allVotes.filter((v) =>
        adminParticipantIds.some((id) => id === v.voterId),
      );

      // Count voted admins (those who have voted for all required positions)
      const positionsByVoter = new Map<string, Set<number>>();
      for (const vote of adminVotes) {
        const positions =
          positionsByVoter.get(vote.voterId) ?? new Set<number>();
        positions.add(vote.votePosition);
        positionsByVoter.set(vote.voterId, positions);
      }

      let votedAdmins = 0;
      for (const participant of adminParticipants) {
        const positions =
          positionsByVoter.get(participant.id) ?? new Set<number>();
        let hasAllPositions = true;
        for (let pos = 1; pos <= requiredPositions; pos++) {
          if (!positions.has(pos)) {
            hasAllPositions = false;
            break;
          }
        }
        if (hasAllPositions && requiredPositions > 0) {
          votedAdmins++;
        }
      }

      const totalAdmins = adminParticipants.length;

      return {
        challengeStatus: challenge.status,
        requiredPositions,
        eligibleSubmissionsCount,
        totalAdmins,
        votedAdmins,
        pendingAdmins: totalAdmins - votedAdmins,
        allAdminsVoted: requiredPositions > 0 && votedAdmins >= totalAdmins,
      };
    });
  }
}
