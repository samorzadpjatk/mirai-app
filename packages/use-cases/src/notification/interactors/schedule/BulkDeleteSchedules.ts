import { Effect } from "effect";
import { NotificationScheduleId } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { BulkDeleteSchedulesResultDTO } from "../../dto/NotificationDTOs";

export interface BulkDeleteSchedulesInput {
  scheduleIds: NotificationScheduleId[];
}

export class BulkDeleteSchedulesUseCase {
  execute(input: BulkDeleteSchedulesInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const deletedCount = yield* schedulePort.deleteMany(input.scheduleIds);

      return {
        success: true,
        deletedCount,
        requestedCount: input.scheduleIds.length,
        notFoundIds:
          deletedCount < input.scheduleIds.length
            ? input.scheduleIds.slice(deletedCount)
            : undefined,
      };
    });
  }
}
