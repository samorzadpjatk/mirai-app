import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { BulkDeleteSchedulesResultDTO } from "../../dto/NotificationDTOs";

export interface BulkDeleteSchedulesInput {
  scheduleIds: string[];
}

export class BulkDeleteSchedulesUseCase {
  execute(
    input: BulkDeleteSchedulesInput,
  ): Effect.Effect<
    BulkDeleteSchedulesResultDTO,
    ApplicationError,
    NotificationSchedulePortTag
  > {
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
