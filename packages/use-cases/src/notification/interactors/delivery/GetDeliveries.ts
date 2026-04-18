import { Effect, Option } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import { NotificationPortTag } from "../../ports/NotificationPort";
import { Data } from "effect";

export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{ notificationId: string }> {}

export interface GetDeliveriesInput {
  tripId?: string;
  status?: string;
  scheduleId?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export class GetDeliveriesUseCase {
  execute(input: GetDeliveriesInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;
      const notificationPort = yield* NotificationPortTag;

      const result = yield* deliveryPort.findAll({
        tripId: input.tripId,
        status: input.status,
        scheduleId: input.scheduleId,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
        offset: input.offset,
      });

      // Fetch all notifications in parallel
      const notificationResults = yield* Effect.all(
        result.deliveries.map((d) =>
          notificationPort.findById(d.notificationId).pipe(
            Effect.map((notification) => ({
              deliveryId: d.id,
              notification: Option.fromNullable(notification),
            })),
          ),
        ),
        { concurrency: "unbounded" },
      );

      // Build lookup map
      const notificationMap = new Map(
        notificationResults.map((r) => [r.deliveryId, r.notification]),
      );

      return {
        deliveries: result.deliveries.map((d) => {
          const notificationOption = notificationMap.get(d.id);
          return {
            ...d,
            notification: Option.getOrNull(notificationOption ?? Option.none()),
          };
        }),
        total: result.total,
        limit: input.limit,
        offset: input.offset,
      };
    });
  }
}
