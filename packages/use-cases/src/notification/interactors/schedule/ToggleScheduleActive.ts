import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { ToggleScheduleResultDTO } from "../../dto/NotificationDTOs";
import { ScheduleNotFoundError } from "./GetScheduleById";

export interface ToggleScheduleActiveInput {
  scheduleId: string;
}

export class ToggleScheduleActiveUseCase {
  execute(
    input: ToggleScheduleActiveInput,
  ): Effect.Effect<
    ToggleScheduleResultDTO,
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
