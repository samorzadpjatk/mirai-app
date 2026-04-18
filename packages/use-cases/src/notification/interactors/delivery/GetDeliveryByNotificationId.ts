import { Effect, Data } from "effect";
import { NotificationId, TripId } from "@mirai-app/domain";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { NotificationDeliveryDTO } from "../../dto/NotificationDTOs";

export class DeliveryNotFoundError extends Data.TaggedError("DeliveryNotFoundError")<{
  notificationId: NotificationId;
}> {}

export interface GetDeliveryByNotificationIdInput {
  notificationId: NotificationId;
  tripId: TripId;
}

export class GetDeliveryByNotificationIdUseCase {
  execute(input: GetDeliveryByNotificationIdInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;

      const delivery = yield* deliveryPort.findByNotificationId(
        input.notificationId,
      );

      if (!delivery || !delivery.tripId || !TripId.equals(delivery.tripId, input.tripId)) {
        return yield* Effect.fail(
          new DeliveryNotFoundError({ notificationId: input.notificationId }),
        );
      }

      return { ...delivery, notification: null } as NotificationDeliveryDTO;
    });
  }
}
