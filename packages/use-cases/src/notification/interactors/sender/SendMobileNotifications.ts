import { Effect } from "effect";
import { NotificationId } from "@mirai-app/domain";
import { NotificationServicePortTag } from "../../ports/NotificationPort";
import type { MobileNotificationResultDTO } from "../../dto/NotificationDTOs";

export interface SendMobileNotificationsInput {
  notificationId: NotificationId;
}

export class SendMobileNotificationsUseCase {
  execute(input: SendMobileNotificationsInput) {
    return Effect.gen(function* () {
      const servicePort = yield* NotificationServicePortTag;

      const result = yield* servicePort.sendMobileNotifications(
        input.notificationId,
      );

      return result;
    });
  }
}
