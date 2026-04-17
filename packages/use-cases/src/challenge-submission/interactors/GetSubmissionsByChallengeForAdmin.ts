import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { ChallengeNotFoundError } from "../../challenge/errors/ChallengeErrors";
import type { SubmissionWithDetailsDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for GetSubmissionsByChallengeForAdminUseCase
 */
export interface GetSubmissionsByChallengeForAdminInput {
  challengeId: string;
  tripId: string;
}

/**
 * Get Submissions By Challenge For Admin Use Case
 *
 * Retrieves all submissions for a challenge (admin/moderator view).
 */
export class GetSubmissionsByChallengeForAdminUseCase {
  execute(
    input: GetSubmissionsByChallengeForAdminInput,
  ): Effect.Effect<
    SubmissionWithDetailsDTO[],
    ChallengeNotFoundError | ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;

      // Verify challenge exists
      const challenge = yield* challengePort.findById(input.challengeId);
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Get submissions
      const submissions = yield* submissionPort.findByChallengeId(
        input.challengeId,
      );

      // Map to DTOs
      return submissions.map(
        (submission): SubmissionWithDetailsDTO => ({
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
        }),
      );
    });
  }
}
