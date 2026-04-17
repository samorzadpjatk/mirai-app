import { Effect } from "effect";
import { NotificationServicePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { MobileNotificationResultDTO } from "../../dto/NotificationDTOs";

export interface SendMobileNotificationsInput {
  notificationId: string;
}

export class SendMobileNotificationsUseCase {
  execute(
    input: SendMobileNotificationsInput,
  ): Effect.Effect<
    MobileNotificationResultDTO,
    ApplicationError,
    NotificationServicePortTag
  > {
    return Effect.gen(function* () {
      const servicePort = yield* NotificationServicePortTag;

      const result = yield* servicePort.sendMobileNotifications(
        input.notificationId,
      );

      return result;
    });
  }
}
