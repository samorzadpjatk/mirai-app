import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { NotificationCreated, NotificationId, TripId } from "@mirai-app/domain";
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
  execute(input: SendNotificationToAllInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;
      const notificationService = yield* NotificationServicePortTag;
      const eventBus = yield* EventBusTag;

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

      // Publish NotificationCreated event after DB write
      const event = new NotificationCreated(
        result.notificationId as NotificationId,
        input.tripId as TripId,
        input.title,
        input.body,
        input.url,
        userIds.map((id) => id as string),
        new Date(),
      );

      yield* eventBus.publish(event);

      return {
        id: result.notificationId,
        success: result.success,
        recipientCount: result.recipientCount,
      };
    });
  }
}
