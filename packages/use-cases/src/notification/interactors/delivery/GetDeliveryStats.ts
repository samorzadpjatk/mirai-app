import { Effect } from "effect";
import { NotificationDeliveryPortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { DeliveryStatsDTO } from "../../dto/NotificationDTOs";

export interface GetDeliveryStatsInput {
  tripId?: string;
  startDate?: Date;
  endDate?: Date;
  scheduleId?: string;
}

export class GetDeliveryStatsUseCase {
  execute(
    input: GetDeliveryStatsInput,
  ): Effect.Effect<
    DeliveryStatsDTO,
    ApplicationError,
    NotificationDeliveryPortTag
  > {
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
