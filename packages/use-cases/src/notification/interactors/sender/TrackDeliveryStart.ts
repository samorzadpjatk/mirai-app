import { Effect } from "effect";
import {
  NotificationDeliveryPortTag,
  NotificationScheduleExecutionPortTag,
} from "../../ports/NotificationPort";

export interface TrackDeliveryStartInput {
  notificationId: string;
}

export class TrackDeliveryStartUseCase {
  execute(input: TrackDeliveryStartInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;
      const executionPort = yield* NotificationScheduleExecutionPortTag;

      // Find schedule execution to get trip info
      const execution = yield* executionPort.findByNotificationId(
        input.notificationId,
      );

      // Create delivery record
      yield* deliveryPort.create({
        id: crypto.randomUUID(),
        notificationId: input.notificationId,
        tripId: execution?.scheduleId ? null : null, // Will be resolved from execution if available
        scheduleId: execution?.scheduleId ?? null,
        status: "pending",
        deliveryStartedAt: new Date(),
        deliveryCompletedAt: null,
        totalRecipients: null,
        successCount: null,
        failureCount: null,
        errors: null,
      });
    });
  }
}
