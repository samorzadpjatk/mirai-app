import { Effect } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";

export interface TrackDeliveryCompleteInput {
  notificationId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  errors: string | null;
}

export class TrackDeliveryCompleteUseCase {
  execute(
    input: TrackDeliveryCompleteInput,
  ): Effect.Effect<void, ApplicationError, NotificationDeliveryPortTag> {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;

      const existing = yield* deliveryPort.findByNotificationId(
        input.notificationId,
      );
      if (!existing) {
        // No existing delivery to update
        return;
      }

      const status =
        input.failureCount === 0
          ? "success"
          : input.successCount === 0
            ? "failure"
            : "partial_failure";

      yield* deliveryPort.update({
        ...existing,
        deliveryCompletedAt: new Date(),
        totalRecipients: input.totalRecipients,
        successCount: input.successCount,
        failureCount: input.failureCount,
        errors: input.errors,
        status,
      });
    });
  }
}
