import { Effect } from "effect";
import { NotificationScheduleId } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { ScheduleNotFoundError } from "../../errors/NotificationErrors";

export interface DeleteScheduleInput {
  scheduleId: NotificationScheduleId;
}

export class DeleteScheduleUseCase {
  execute(input: DeleteScheduleInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const existing = yield* schedulePort.findById(input.scheduleId);
      if (!existing) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      const executionCount = yield* schedulePort.countExecutions(
        input.scheduleId,
      );
      yield* schedulePort.delete(input.scheduleId);

      return {
        success: true,
        message: `Schedule "${existing.name}" deleted successfully. ${executionCount} execution records were also removed.`,
      };
    });
  }
}
