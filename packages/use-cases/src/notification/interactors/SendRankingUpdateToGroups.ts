import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import type { SendRankingUpdateInputDTO } from "../dto/NotificationDTOs";

/**
 * Input for SendRankingUpdateToGroupsUseCase
 */
export interface SendRankingUpdateToGroupsInput extends SendRankingUpdateInputDTO {}

/**
 * Send Ranking Update To Groups Use Case
 *
 * Sends ranking update notifications to all groups in a trip.
 */
export class SendRankingUpdateToGroupsUseCase {
  execute(input: SendRankingUpdateToGroupsInput) {
    return Effect.gen(function* () {
      const notificationService = yield* NotificationServicePortTag;

      // Send ranking update notification
      const result = yield* notificationService.sendRankingUpdate({
        tripId: input.tripId,
        createdById: input.createdById,
      });

      return {
        id: result.notificationId,
        success: result.success,
        recipientCount: result.recipientCount,
      };
    });
  }
}
