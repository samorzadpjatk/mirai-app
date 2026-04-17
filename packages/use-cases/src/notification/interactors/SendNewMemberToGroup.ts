import { Effect, Data } from "effect";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { GroupPort } from "../../group/ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  CreateNotificationResultDTO,
  SendNewMemberNotificationInputDTO,
} from "../dto/NotificationDTOs";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

/**
 * User not found error
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}>() {}

/**
 * Input for SendNewMemberToGroupUseCase
 */
export interface SendNewMemberToGroupInput extends SendNewMemberNotificationInputDTO {}

/**
 * Send New Member To Group Use Case
 *
 * Sends a notification when a new member joins a group.
 */
export class SendNewMemberToGroupUseCase {
  execute(
    input: SendNewMemberToGroupInput,
  ): Effect.Effect<
    CreateNotificationResultDTO,
    ApplicationError | GroupNotFoundError | UserNotFoundError,
    GroupPort | TripParticipantPort | UserPortTag | NotificationServicePortTag
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const userPort = yield* UserPortTag;
      const notificationService = yield* NotificationServicePortTag;

      // Verify group exists and belongs to trip
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Get user details
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Format full name
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const memberName =
        fullName || user.firstName || user.lastName || "A new member";

      // Get all participants in the group
      const participants = yield* participantPort.findByTripId(input.tripId);
      const groupParticipants = participants.filter(
        (p) => p.groupId === input.groupId,
      );
      const userIds = groupParticipants.map((p) => p.userId);

      // Create notification data
      const notificationData = notificationService.createNewMemberNotification(
        group.name,
        memberName,
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
