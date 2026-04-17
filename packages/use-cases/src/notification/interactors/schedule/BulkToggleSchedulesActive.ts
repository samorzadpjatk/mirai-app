import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { BulkToggleSchedulesResultDTO } from "../../dto/NotificationDTOs";

export interface BulkToggleSchedulesActiveInput {
  scheduleIds: string[];
  isActive: boolean;
}

export class BulkToggleSchedulesActiveUseCase {
  execute(input: BulkToggleSchedulesActiveInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const updatedCount = yield* schedulePort.toggleMany(
        input.scheduleIds,
        input.isActive,
      );

      return {
        success: true,
        updatedCount,
      };
    });
  }
}
