import { Effect } from "effect";
import { NotificationScheduleId } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { ScheduleNotFoundError } from "../../errors/NotificationErrors";

export interface UpdateScheduleLastRunInput {
  scheduleId: NotificationScheduleId;
  lastRun: Date;
}

export class UpdateScheduleLastRunUseCase {
  execute(input: UpdateScheduleLastRunInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const existing = yield* schedulePort.findById(input.scheduleId);
      if (!existing) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      const updated = yield* schedulePort.updateLastRun(
        input.scheduleId,
        input.lastRun,
      );

      return updated;
    });
  }
}
