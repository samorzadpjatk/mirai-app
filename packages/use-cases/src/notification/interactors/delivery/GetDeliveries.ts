import { Effect } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";

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

      const result = yield* deliveryPort.findAll({
        tripId: input.tripId,
        status: input.status,
        scheduleId: input.scheduleId,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        deliveries: result.deliveries.map((d) => ({
          ...d,
          notification: null, // To be hydrated by adapter
        })),
        total: result.total,
        limit: input.limit,
        offset: input.offset,
      };
    });
  }
}
