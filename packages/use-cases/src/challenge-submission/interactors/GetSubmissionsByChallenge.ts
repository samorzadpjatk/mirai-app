import { Effect } from "effect";
import { ChallengeId, GroupId, UserId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "../ports/ChallengeSubmissionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
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
  execute(input: GetSubmissionsByChallengeInput) {
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

      const shouldHideUnapprovedMedia = !input.isAdmin && !input.isModerator;

      // Collect unique IDs for parallel fetching
      const groupIds = [...new Set(submissions.map(s => s.groupId))];
      const reviewerIds = [...new Set(
        submissions.map(s => s.reviewedById).filter((id): id is NonNullable<typeof id> => id !== null),
      )];

      // Fetch all related entities in parallel
      const [groups, reviewers] = yield* Effect.all([
        Effect.all(
          groupIds.map(id => groupPort.findById(GroupId.unsafeCreate(id))),
          { concurrency: "unbounded" },
        ),
        Effect.all(
          reviewerIds.map(id => userPort.findById(id)),
          { concurrency: "unbounded" },
        ),
      ]);

      // Build lookup maps for O(1) access
      const groupMap = new Map(
      groups.filter(Boolean).map(g => [g!.id.toString(), g!]),
      );
      const reviewerMap = new Map(
      reviewers.filter(Boolean).map(r => [r!.id.toString(), r!]),
      );

      // Map to DTOs with fully populated data
      return submissions.map((submission): SubmissionWithDetailsDTO => {
        const isApproved = submission.status === "APPROVED";
        const shouldSanitize = shouldHideUnapprovedMedia && !isApproved;

        const group = groupMap.get(submission.groupId.toString());
        const reviewer = submission.reviewedById
          ? reviewerMap.get(submission.reviewedById.toString())
          : null;

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
          ranking: submission.ranking as 1 | 2 | 3 | null,
          voteCount: submission.voteCount,
          voteScore: submission.voteScore,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          group: group ? {
            id: group.id,
            name: group.name,
            description: group.description,
            image: group.image,
          } : null,
          reviewedBy: reviewer ? {
            id: reviewer.id,
            firstName: reviewer.firstName,
            lastName: reviewer.lastName,
            email: null,
          } : null,
          challenge: {
            id: challenge.id,
            tripId: challenge.tripId.toString(),
            name: challenge.name,
          },
        };
      });
    });
  }
}
