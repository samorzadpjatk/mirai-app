import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import { ChallengeSubmissionPort } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
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
  execute(
    input: GetChallengesByTripInput,
  ): Effect.Effect<
    PaginatedChallengesDTO,
    ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const participantPort = yield* TripParticipantPort;

      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      // Activate visible challenges for this trip
      yield* challengePort.activateVisibleChallenges(input.tripId);

      // Get paginated challenges
      const result = yield* challengePort.findPaginatedByTripId(input.tripId, {
        limit,
        offset,
      });

      // Get participant info for this user
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      // Gather stats for each challenge
      const challengesWithStats: ChallengeWithStatsDTO[] = [];
      for (const challenge of result.challenges) {
        const [submissionCount, pendingCount, mySubmission] = yield* Effect.all(
          [
            submissionPort.countByChallengeId(challenge.id),
            submissionPort.countPendingByChallengeId(challenge.id),
            participant && participant.groupId
              ? submissionPort.findByChallengeAndGroup(
                  challenge.id,
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
          myGroupSubmissionStatus: mySubmission?.status ?? null,
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
