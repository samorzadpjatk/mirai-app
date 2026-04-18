import { Effect } from "effect";
import { ChallengeId, TripId, GroupId, UserId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
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
  execute(input: GetMySubmissionForChallengeInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        UserId.unsafeCreate(input.userId),
        TripId.unsafeCreate(input.tripId),
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
      const challenge = yield* challengePort.findById(ChallengeId.unsafeCreate(input.challengeId));
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Get submission for this group
      const submission = yield* submissionPort.findByChallengeAndGroup(
        ChallengeId.unsafeCreate(input.challengeId),
        participant.groupId,
      );

      if (!submission) {
        return null;
      }

      // Fetch related data in parallel
      const [group, reviewer] = yield* Effect.all([
        groupPort.findById(GroupId.unsafeCreate(submission.groupId)),
        submission.reviewedById
          ? userPort.findById(submission.reviewedById)
          : Effect.succeed(null),
      ]);

      // Map to fully-populated DTO
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
              email: null,
            }
          : null,
        challenge: {
          id: challenge.id,
          tripId: challenge.tripId,
          name: challenge.name,
        },
      } satisfies SubmissionWithDetailsDTO;
    });
  }
}
