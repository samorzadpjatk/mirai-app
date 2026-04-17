import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { SubmissionNotFoundError } from "../errors/SubmissionErrors";
import type { SubmissionWithDetailsDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for GetSubmissionByIdUseCase
 */
export interface GetSubmissionByIdInput {
  submissionId: string;
  tripId: string;
}

/**
 * Get Submission By ID Use Case
 *
 * Retrieves a submission by its ID.
 */
export class GetSubmissionByIdUseCase {
  execute(
    input: GetSubmissionByIdInput,
  ): Effect.Effect<
    SubmissionWithDetailsDTO,
    SubmissionNotFoundError | ApplicationError,
    ChallengeSubmissionPort
  > {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPort;

      // Find submission
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
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
