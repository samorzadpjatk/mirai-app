import { Effect, Data } from "effect";
import { TripId, UserId, ChallengeId } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type {
  ChallengeWithStatsDTO,
  PaginatedChallengesDTO,
} from "../dto/ChallengeDTOs";
import type { TripParticipant } from "@mirai-app/domain";

/**
 * Input for GetChallengesByTripUseCase
 */
export interface GetChallengesByTripInput {
  tripId: string;
  limit?: number;
  offset?: number;
  userId: string;
}

/**
 * Get Challenges By Trip Use Case
 *
 * Retrieves challenges for a specific trip with pagination and user stats.
 */
export class GetChallengesByTripUseCase {
  execute(input: GetChallengesByTripInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);
      const userId = UserId.unsafeCreate(input.userId);
      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      // Activate visible challenges for this trip
      yield* challengePort.activateVisibleChallenges(tripId);

      // Get paginated challenges
      const result = yield* challengePort.findPaginatedByTripId(tripId, {
        limit,
        offset,
      });

      // Get participant info for this user
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      // Gather stats for each challenge
      const challengesWithStats: ChallengeWithStatsDTO[] = [];
      for (const challenge of result.challenges) {
        const challengeId = ChallengeId.unsafeCreate(
          typeof challenge.id === "string" ? challenge.id : ChallengeId.toString(challenge.id)
        );
        const [submissionCount, pendingCount, mySubmission] = yield* Effect.all(
          [
            submissionPort.countByChallengeId(challengeId),
            submissionPort.countPendingByChallengeId(challengeId),
            participant && participant.groupId
              ? submissionPort.findByChallengeAndGroup(
                  challengeId,
                  participant.groupId,
                )
              : Effect.succeed(null),
          ],
        );

        challengesWithStats.push({
          id: challenge.id,
          tripId: challenge.tripId,
          name: challenge.name,
          description: challenge.description,
          image: challenge.image,
          submissionType: challenge.submissionType,
          scoringCategory: challenge.scoringCategory,
          isRecurring: challenge.isRecurring,
          dailyStartTime: challenge.dailyStartTime,
          dailyEndTime: challenge.dailyEndTime,
          basePoints: challenge.basePoints,
          firstPlacePoints: challenge.firstPlacePoints,
          secondPlacePoints: challenge.secondPlacePoints,
          thirdPlacePoints: challenge.thirdPlacePoints,
          status: challenge.status,
          startTime: challenge.startTime,
          endTime: challenge.endTime,
          votingStartTime: challenge.votingStartTime,
          votingEndTime: challenge.votingEndTime,
          targetLatitude: challenge.targetLatitude,
          targetLongitude: challenge.targetLongitude,
          expectedValue: challenge.expectedValue,
          autoApprove: challenge.autoApprove,
          createdAt: challenge.createdAt,
          updatedAt: challenge.updatedAt,
          submissionCount,
          approvedSubmissionCount: submissionCount - pendingCount,
          pendingSubmissionCount: pendingCount,
        });
      }

      return {
        challenges: challengesWithStats,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
        },
      };
    });
  }
}
