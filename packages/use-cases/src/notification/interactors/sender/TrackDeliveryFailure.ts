import { Effect } from "effect";
import {
  NotificationDeliveryPortTag,
  NotificationScheduleExecutionPortTag,
} from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";

export interface TrackDeliveryFailureInput {
  notificationId: string;
  error: string;
}

export class TrackDeliveryFailureUseCase {
  execute(
    input: TrackDeliveryFailureInput,
  ): Effect.Effect<
    void,
    ApplicationError,
    NotificationDeliveryPortTag | NotificationScheduleExecutionPortTag
  > {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;
      const executionPort = yield* NotificationScheduleExecutionPortTag;

      const existing = yield* deliveryPort.findByNotificationId(
        input.notificationId,
      );

      if (existing) {
        yield* deliveryPort.update({
          ...existing,
          deliveryCompletedAt: new Date(),
          errors: input.error,
          status: "failure",
        });
      } else {
        // Create new failed delivery record
        const execution = yield* executionPort.findByNotificationId(
          input.notificationId,
        );

        yield* deliveryPort.create({
          id: crypto.randomUUID(),
          notificationId: input.notificationId,
          tripId: execution?.scheduleId ? null : null,
          scheduleId: execution?.scheduleId ?? null,
          status: "failure",
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          totalRecipients: null,
          successCount: null,
          failureCount: null,
          errors: input.error,
        });
      }
    });
  }
}
