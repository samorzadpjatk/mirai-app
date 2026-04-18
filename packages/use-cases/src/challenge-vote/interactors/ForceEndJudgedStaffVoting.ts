import { Effect, Data } from "effect";
import { ChallengeId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeVotePortTag } from "../ports/ChallengeVotePort";
import {
  NotJudgedStaffChallengeError,
  StaffVotingNotStartedError,
} from "../errors/VoteErrors";
import type { JudgedStaffProgressResult } from "./GetJudgedStaffProgress";

/**
 * Input for ForceEndJudgedStaffVotingUseCase
 */
export interface ForceEndJudgedStaffVotingInput {
  challengeId: string;
  tripId: string;
  adminId: string;
}

/**
 * Force End Judged Staff Voting Result
 */
export interface ForceEndJudgedStaffVotingResult extends JudgedStaffProgressResult {
  success: boolean;
  finalized: boolean;
}

/**
 * Force End Judged Staff Voting Use Case
 *
 * Forces the end of judged staff voting for a challenge.
 */
export class ForceEndJudgedStaffVotingUseCase {
  execute(input: ForceEndJudgedStaffVotingInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      // Get challenge
      const challengeId = ChallengeId.create(input.challengeId);
      const challenge = yield* challengePort.findById(challengeId);

      if (!challenge || challenge.scoringCategory !== "JUDGED_STAFF") {
        return yield* Effect.fail(
          new NotJudgedStaffChallengeError({
            challengeId: ChallengeId.toString(challengeId),
            scoringCategory: challenge?.scoringCategory ?? "UNKNOWN",
          }),
        );
      }

      if (challenge.status === "CANCELLED") {
        return yield* Effect.fail(
          new StaffVotingNotStartedError({
            challengeId: ChallengeId.toString(challengeId),
            endTime: new Date(),
          }),
        );
      }

      if (!challenge.endTime || challenge.endTime.getTime() > Date.now()) {
        return yield* Effect.fail(
          new StaffVotingNotStartedError({
            challengeId: ChallengeId.toString(challengeId),
            endTime: challenge.endTime ?? new Date(),
          }),
        );
      }

      // Complete the challenge
      const completed = challenge.complete();
      yield* challengePort.update(completed);

      return {
        success: true,
        finalized: true,
        challengeStatus: "COMPLETED",
        requiredPositions: 0,
        eligibleSubmissionsCount: 0,
        totalAdmins: 0,
        votedAdmins: 0,
        pendingAdmins: 0,
        allAdminsVoted: true,
      };
    });
  }
}
