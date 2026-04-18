import { Effect } from "effect";
import { NotificationScheduleId } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { ScheduleNotFoundError } from "../../errors/NotificationErrors";

export interface ToggleScheduleActiveInput {
  scheduleId: NotificationScheduleId;
}

export class ToggleScheduleActiveUseCase {
  execute(input: ToggleScheduleActiveInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const existing = yield* schedulePort.findById(input.scheduleId);
      if (!existing) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      const updated = yield* schedulePort.toggleActive(
        input.scheduleId,
        !existing.isActive,
      );

      return {
        schedule: {
          ...updated,
          createdBy: null,
          trip: null,
          executionCount: 0,
        },
      };
    });
  }
}
