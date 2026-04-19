import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { SendRankingUpdateInputDTO } from "../dto/NotificationDTOs";

/**
 * Input for SendRankingUpdateToGroupsUseCase
 */
export interface SendRankingUpdateToGroupsInput extends SendRankingUpdateInputDTO {}

/**
 * Send Ranking Update To Groups Use Case
 *
 * Sends ranking update notifications to all trip participants with current group rankings.
 */
export class SendRankingUpdateToGroupsUseCase {
  execute(input: SendRankingUpdateToGroupsInput) {
    return Effect.gen(function* () {
      const notificationService = yield* NotificationServicePortTag;
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Get current group rankings for the trip
      const rankedGroups = yield* groupPort.getRanking(input.tripId);

      // Get all trip participants to notify
      const participants = yield* participantPort.findByTripIdWithRelations(
        input.tripId,
      );

      // Extract unique user IDs from participants
      const userIds = [...new Set(participants.map((p) => p.user.id))];

      // Map groups to ranking data
      const groups = rankedGroups.map((group, index) => ({
        id: group.id,
        name: group.name,
        coins: group.coins,
        rank: index + 1,
      }));

      // Send ranking update notification
      const result = yield* notificationService.sendRankingUpdate({
        tripId: input.tripId,
        createdById: input.createdById,
        groups,
        userIds,
      });

      return {
        id: result.notificationId,
        success: result.success,
        recipientCount: result.recipientCount,
      };
    });
  }
}
