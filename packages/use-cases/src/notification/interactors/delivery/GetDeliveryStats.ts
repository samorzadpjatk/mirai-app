import { Effect } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import type { DeliveryStatsDTO } from "../../dto/NotificationDTOs";

export interface GetDeliveryStatsInput {
  tripId?: string;
  startDate?: Date;
  endDate?: Date;
  scheduleId?: string;
}

export class GetDeliveryStatsUseCase {
  execute(input: GetDeliveryStatsInput) {
    return Effect.gen(function* () {
      const deliveryPort = yield* NotificationDeliveryPortTag;

      const stats = yield* deliveryPort.getStats({
        tripId: input.tripId,
        startDate: input.startDate,
        endDate: input.endDate,
        scheduleId: input.scheduleId,
      });

      return stats;
    });
  }
}
