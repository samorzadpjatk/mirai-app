import { Effect } from "effect";
import { ChallengeId, GroupId, UserId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "../ports/ChallengeSubmissionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
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
  execute(input: GetSubmissionsByChallengeForAdminInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

      // Verify challenge exists
      const challenge = yield* challengePort.findById(ChallengeId.unsafeCreate(input.challengeId));
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Get submissions
      const submissions = yield* submissionPort.findByChallengeId(
        ChallengeId.unsafeCreate(input.challengeId),
      );

      // Collect unique IDs for batch fetching
      const groupIds = [...new Set(submissions.map((s) => s.groupId))];
      const reviewerIds = [
        ...new Set(
          submissions
            .map((s) => s.reviewedById)
            .filter((id): id is NonNullable<typeof id> => id !== null),
        ),
      ];

      // Fetch all groups and reviewers in parallel
      const [groups, reviewers] = yield* Effect.all([
        Effect.all(groupIds.map((id) => groupPort.findById(GroupId.unsafeCreate(id)))),
        Effect.all(reviewerIds.map((id) => userPort.findById(UserId.unsafeCreate(id)))),
      ]);

      // Build lookup maps
      const groupMap = new Map(
        groups
          .filter((g): g is NonNullable<typeof g> => g !== null)
          .map((g) => [GroupId.toString(g.id), g]),
      );
      const reviewerMap = new Map(
        reviewers
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => [UserId.toString(r.id), r]),
      );

      // Map to fully-populated DTOs
      return submissions.map(
        (submission): SubmissionWithDetailsDTO => {
          const group = groupMap.get(submission.groupId);
          const reviewer = submission.reviewedById
            ? reviewerMap.get(submission.reviewedById)
            : null;

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
            group: group
              ? {
                  id: group.id,
                  name: group.name,
                  description: group.description,
                  image: group.image,
                }
              : null,
            reviewedBy: reviewer
              ? {
                  id: reviewer.id,
                  firstName: reviewer.firstName,
                  lastName: reviewer.lastName,
                  email: null, // User entity does not have email property
                }
              : null,
            challenge: {
              id: challenge.id,
              tripId: challenge.tripId,
              name: challenge.name,
            },
          };
        },
      );
    });
  }
}
