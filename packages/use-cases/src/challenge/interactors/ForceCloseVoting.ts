import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import {
  ChallengeNotFoundError,
  NotPeerVotingChallengeError,
  ChallengeNotInVotingPhaseError,
} from "../errors/ChallengeErrors";
import type { ChallengeDTO } from "../dto/ChallengeDTOs";

/**
 * Input for ForceCloseVotingUseCase
 */
export interface ForceCloseVotingInput {
  challengeId: string;
  tripId: string;
  adminId: string;
}

/**
 * Force Close Voting Use Case
 *
 * Forces the voting phase to close for a peer voting challenge.
 * Only available for peer voting challenges in voting phase.
 */
export class ForceCloseVotingUseCase {
  execute(
    input: ForceCloseVotingInput,
  ): Effect.Effect<
    ChallengeDTO,
    | ChallengeNotFoundError
    | NotPeerVotingChallengeError
    | ChallengeNotInVotingPhaseError
    | ApplicationError,
    ChallengePortTag
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      // Find challenge
      const challenge = yield* challengePort.findById(input.challengeId);
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Verify it's a peer voting challenge
      if (challenge.scoringCategory !== "PEER_VOTING") {
        return yield* Effect.fail(
          new NotPeerVotingChallengeError({
            challengeId: input.challengeId,
            scoringCategory: challenge.scoringCategory,
          }),
        );
      }

      // Verify challenge is in voting phase
      if (challenge.status !== "VOTING_PHASE") {
        return yield* Effect.fail(
          new ChallengeNotInVotingPhaseError({
            challengeId: input.challengeId,
            currentStatus: challenge.status,
          }),
        );
      }

      // Complete the challenge
      const completed = challenge.complete();
      const saved = yield* challengePort.update(completed);

      // Map to DTO
      return {
        id: saved.id,
        tripId: saved.tripId,
        name: saved.name,
        description: saved.description,
        image: saved.image,
        submissionType: saved.submissionType,
        scoringCategory: saved.scoringCategory,
        isRecurring: saved.isRecurring,
        dailyStartTime: saved.dailyStartTime,
        dailyEndTime: saved.dailyEndTime,
        basePoints: saved.basePoints,
        firstPlacePoints: saved.firstPlacePoints,
        secondPlacePoints: saved.secondPlacePoints,
        thirdPlacePoints: saved.thirdPlacePoints,
        status: saved.status,
        startTime: saved.startTime,
        endTime: saved.endTime,
        votingStartTime: saved.votingStartTime,
        votingEndTime: new Date(), // Force close sets end time to now
        targetLatitude: saved.targetLatitude,
        targetLongitude: saved.targetLongitude,
        expectedValue: saved.expectedValue,
        autoApprove: saved.autoApprove,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }
}
