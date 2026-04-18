import { Effect } from "effect";
import {
  ChallengeSubmissionId,
} from "@mirai-app/domain";
import { ChallengeSubmissionPortTag } from "../ports/ChallengeSubmissionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
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
 * Retrieves a submission by its ID with all related details populated.
 */
export class GetSubmissionByIdUseCase {
  execute(input: GetSubmissionByIdInput) {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;
      const challengePort = yield* ChallengePortTag;

      // Find submission
      const submission = yield* submissionPort.findById(
        ChallengeSubmissionId.unsafeCreate(input.submissionId),
      );

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Fetch all related entities in parallel
      const [groupResult, reviewedByResult, challengeResult] = yield* Effect.all(
        [
          groupPort.findById(submission.groupId),
          submission.reviewedById
            ? userPort.findById(submission.reviewedById)
            : Effect.succeed(null),
          challengePort.findById(submission.challengeId),
        ],
        { concurrency: "unbounded" },
      );

      // Build populated DTO
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
        ranking: submission.ranking as 1 | 2 | 3 | null,
        voteCount: submission.voteCount,
        voteScore: submission.voteScore,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        group: groupResult
          ? {
              id: groupResult.id,
              name: groupResult.name,
              description: groupResult.description,
              image: groupResult.image,
            }
          : null,
        reviewedBy: reviewedByResult
          ? {
              id: reviewedByResult.id,
              firstName: reviewedByResult.firstName,
              lastName: reviewedByResult.lastName,
              email: null,
            }
          : null,
        challenge: challengeResult
          ? {
              id: challengeResult.id,
              tripId: challengeResult.tripId,
              name: challengeResult.name,
            }
          : null,
      } satisfies SubmissionWithDetailsDTO;
    });
  }
}
