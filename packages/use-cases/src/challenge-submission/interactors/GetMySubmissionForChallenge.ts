import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { ChallengeNotFoundError } from "../../challenge/errors/ChallengeErrors";
import { NotGroupMemberError } from "../errors/SubmissionErrors";
import type { SubmissionWithDetailsDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for GetMySubmissionForChallengeUseCase
 */
export interface GetMySubmissionForChallengeInput {
  challengeId: string;
  tripId: string;
  userId: string;
}

/**
 * Get My Submission For Challenge Use Case
 *
 * Retrieves the current user's group's submission for a specific challenge.
 */
export class GetMySubmissionForChallengeUseCase {
  execute(
    input: GetMySubmissionForChallengeInput,
  ): Effect.Effect<
    SubmissionWithDetailsDTO | null,
    ChallengeNotFoundError | NotGroupMemberError | ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const participantPort = yield* TripParticipantPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new NotGroupMemberError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // If user has no group, return null
      if (!participant.groupId) {
        return null;
      }

      // Verify challenge exists
      const challenge = yield* challengePort.findById(input.challengeId);
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Get submission for this group
      const submission = yield* submissionPort.findByChallengeAndGroup(
        input.challengeId,
        participant.groupId,
      );

      if (!submission) {
        return null;
      }

      // Map to DTO
      return {
        id: submission.id,
        challengeId: submission.challengeId,
        groupId: submission.groupId,
        imageIds: submission.imageIds,
        videoId: submission.videoId,
        textContent: submission.textContent,
        latitude: submission.latitude,
        longitude: submission.longitude,
        status: submission.status,
        reviewedById: submission.reviewedById,
        reviewedAt: submission.reviewedAt,
        rejectionReason: submission.rejectionReason,
        awardedPoints: submission.awardedPoints ?? 0,
        bonusPoints: submission.bonusPoints ?? 0,
        ranking: submission.ranking,
        voteCount: submission.voteCount,
        voteScore: submission.voteScore,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        group: null, // Will be hydrated by adapter
        reviewedBy: null, // Will be hydrated by adapter
        challenge: null, // Will be hydrated by adapter
      };
    });
  }
}
