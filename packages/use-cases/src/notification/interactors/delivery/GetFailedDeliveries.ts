import { Effect } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";

export interface GetFailedDeliveriesInput {
  tripId?: string;
  limit: number;
  offset: number;
}

export class GetFailedDeliveriesUseCase {
  execute(input: GetFailedDeliveriesInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;

      const result = yield* deliveryPort.findFailed({
        tripId: input.tripId,
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
