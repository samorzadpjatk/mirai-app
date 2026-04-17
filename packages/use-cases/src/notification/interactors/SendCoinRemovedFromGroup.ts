import { Effect, Data } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { GroupPort } from "../../group/ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  CreateNotificationResultDTO,
  SendCoinsNotificationInputDTO,
} from "../dto/NotificationDTOs";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

/**
 * Input for SendCoinRemovedFromGroupUseCase
 */
export interface SendCoinRemovedFromGroupInput extends SendCoinsNotificationInputDTO {}

/**
 * Send Coin Removed From Group Use Case
 *
 * Sends a notification when coins are removed from a group.
 */
export class SendCoinRemovedFromGroupUseCase {
  execute(
    input: SendCoinRemovedFromGroupInput,
  ): Effect.Effect<
    CreateNotificationResultDTO,
    ApplicationError | GroupNotFoundError,
    NotificationServicePortTag | GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const notificationService = yield* NotificationServicePortTag;

      // Verify group exists and belongs to trip
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.tripId !== input.tripId) {
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

      // Create notification data
      const notificationData =
        notificationService.createCoinsRemovedNotification(
          group.name,
          input.coins,
          input.reason,
        );

      // Send notification
      const result = yield* notificationService.sendNotification({
        userIds,
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
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
