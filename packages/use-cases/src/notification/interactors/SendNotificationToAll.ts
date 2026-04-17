import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  CreateNotificationResultDTO,
  SendToAllInputDTO,
} from "../dto/NotificationDTOs";

/**
 * Input for SendNotificationToAllUseCase
 */
export interface SendNotificationToAllInput extends SendToAllInputDTO {}

/**
 * Send Notification To All Use Case
 *
 * Sends a notification to all participants of a trip.
 */
export class SendNotificationToAllUseCase {
  execute(
    input: SendNotificationToAllInput,
  ): Effect.Effect<
    CreateNotificationResultDTO,
    ApplicationError,
    NotificationServicePortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;
      const notificationService = yield* NotificationServicePortTag;

      // Get all participants in the trip
      const participants = yield* participantPort.findByTripId(input.tripId);
      const userIds = participants.map((p) => p.userId);

      // Send notification
      const result = yield* notificationService.sendNotification({
        userIds,
        title: input.title,
        body: input.body,
        url: input.url,
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
