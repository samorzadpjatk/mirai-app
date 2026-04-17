import { Effect, Data } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { NotificationDeliveryDTO } from "../../dto/NotificationDTOs";

export class DeliveryNotFoundError extends Data.TaggedError(
  "DeliveryNotFoundError",
)<{
  notificationId: string;
}>() {}

export interface GetDeliveryByNotificationIdInput {
  notificationId: string;
  tripId: string;
}

export class GetDeliveryByNotificationIdUseCase {
  execute(
    input: GetDeliveryByNotificationIdInput,
  ): Effect.Effect<
    NotificationDeliveryDTO,
    ApplicationError | DeliveryNotFoundError,
    NotificationDeliveryPortTag
  > {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;

      const delivery = yield* deliveryPort.findByNotificationId(
        input.notificationId,
      );

      if (!delivery || delivery.tripId !== input.tripId) {
        return yield* Effect.fail(
          new DeliveryNotFoundError({ notificationId: input.notificationId }),
        );
      }

      return { ...delivery, notification: null }; // To be hydrated by adapter
    });
  }
}
