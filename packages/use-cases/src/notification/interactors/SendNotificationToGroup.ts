import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { NotificationCreated } from "@mirai-app/domain";
import type {
  CreateNotificationResultDTO,
  SendToGroupInputDTO,
} from "../dto/NotificationDTOs";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

/**
 * Input for SendNotificationToGroupUseCase
 */
export interface SendNotificationToGroupInput extends SendToGroupInputDTO {}

/**
 * Send Notification To Group Use Case
 *
 * Sends a notification to all members of a specific group.
 */
export class SendNotificationToGroupUseCase {
  execute(input: SendNotificationToGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const notificationService = yield* NotificationServicePortTag;
      const eventBus = yield* EventBusTag;

      // Verify group exists and belongs to trip
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Get all participants in the group
      const participants = yield* participantPort.findByTripId(input.tripId);
      const groupParticipants = participants.filter(
        (p) => p.groupId === input.groupId,
      );
      const userIds = groupParticipants.map((p) => p.userId);

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
        result.notificationId,
        input.tripId,
        input.title,
        input.body,
        input.url,
        userIds,
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
