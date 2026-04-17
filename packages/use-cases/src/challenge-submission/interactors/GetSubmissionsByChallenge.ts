import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { ChallengeNotFoundError } from "../../challenge/errors/ChallengeErrors";
import type { SubmissionWithDetailsDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for GetSubmissionsByChallengeUseCase
 */
export interface GetSubmissionsByChallengeInput {
  challengeId: string;
  tripId: string;
  userId: string;
  isAdmin?: boolean;
  isModerator?: boolean;
}

/**
 * Get Submissions By Challenge Use Case
 *
 * Retrieves submissions for a challenge.
 * Non-admin users see sanitized versions of unapproved submissions.
 */
export class GetSubmissionsByChallengeUseCase {
  execute(
    input: GetSubmissionsByChallengeInput,
  ): Effect.Effect<
    SubmissionWithDetailsDTO[],
    ChallengeNotFoundError | ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort | TripParticipantPort
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

      const shouldHideUnapprovedMedia = !input.isAdmin && !input.isModerator;

      // Map to DTOs with optional sanitization
      return submissions.map((submission): SubmissionWithDetailsDTO => {
        const isApproved = submission.status === "APPROVED";
        const shouldSanitize = shouldHideUnapprovedMedia && !isApproved;

        return {
          id: submission.id,
          challengeId: submission.challengeId,
          groupId: submission.groupId,
          imageIds: shouldSanitize ? [] : submission.imageIds,
          videoId: shouldSanitize ? null : submission.videoId,
          textContent: submission.textContent,
          latitude: shouldSanitize ? null : submission.latitude,
          longitude: shouldSanitize ? null : submission.longitude,
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
    });
  }
}
