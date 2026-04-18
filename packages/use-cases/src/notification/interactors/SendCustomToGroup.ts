import { Effect } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { NotificationCreated, NotificationId, TripId } from "@mirai-app/domain";
import type {
  CreateNotificationResultDTO,
  SendCustomNotificationInputDTO,
} from "../dto/NotificationDTOs";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

/**
 * Input for SendCustomToGroupUseCase
 */
export interface SendCustomToGroupInput extends SendCustomNotificationInputDTO {}

/**
 * Send Custom To Group Use Case
 *
 * Sends a custom notification to a specific group.
 */
export class SendCustomToGroupUseCase {
  execute(input: SendCustomToGroupInput) {
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
