import { Effect } from "effect";
import { NotificationId } from "@mirai-app/domain";
import {
  NotificationDeliveryPortTag,
  NotificationPortTag,
} from "../../ports/NotificationPort";

export interface GetFailedDeliveriesInput {
  tripId?: string;
  limit: number;
  offset: number;
}

export class GetFailedDeliveriesUseCase {
  execute(input: GetFailedDeliveriesInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;
      const notificationPort = yield* NotificationPortTag;

      const result = yield* deliveryPort.findFailed({
        tripId: input.tripId,
        limit: input.limit,
        offset: input.offset,
      });

      const notifications = yield* Effect.all(
        result.deliveries.map((d) =>
          notificationPort.findById(
            NotificationId.create(d.notificationId),
          ),
        ),
      );

      const deliveriesWithNotifications = result.deliveries.map(
        (delivery, index) => {
          const notification = notifications[index];

          if (!notification) {
            return {
              ...delivery,
              notification: null,
            };
          }

          return {
            ...delivery,
            notification: {
              id: notification.id,
              title: notification.title,
              body: notification.body,
              url: notification.url,
              tripId: notification.tripId,
              createdById: notification.createdById,
              createdAt: notification.createdAt,
            },
          };
        },
      );

      return {
        deliveries: deliveriesWithNotifications,
        total: result.total,
        limit: input.limit,
        offset: input.offset,
      };
    });
  }
}
