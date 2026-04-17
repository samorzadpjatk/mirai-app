import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { DeleteScheduleResultDTO } from "../../dto/NotificationDTOs";
import { ScheduleNotFoundError } from "./GetScheduleById";

export interface DeleteScheduleInput {
  scheduleId: string;
}

export class DeleteScheduleUseCase {
  execute(
    input: DeleteScheduleInput,
  ): Effect.Effect<
    DeleteScheduleResultDTO,
    ApplicationError | ScheduleNotFoundError,
    NotificationSchedulePortTag
  > {
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
