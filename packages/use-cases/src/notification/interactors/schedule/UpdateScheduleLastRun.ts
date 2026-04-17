import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto/NotificationDTOs";
import { ScheduleNotFoundError } from "./GetScheduleById";

export interface UpdateScheduleLastRunInput {
  scheduleId: string;
  lastRun: Date;
}

export class UpdateScheduleLastRunUseCase {
  execute(
    input: UpdateScheduleLastRunInput,
  ): Effect.Effect<
    NotificationScheduleDTO,
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

      const updated = yield* schedulePort.updateLastRun(
        input.scheduleId,
        input.lastRun,
      );

      return updated;
    });
  }
}
