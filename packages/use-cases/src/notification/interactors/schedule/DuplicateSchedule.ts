import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { DuplicateScheduleResultDTO } from "../../dto/NotificationDTOs";
import { ScheduleNotFoundError } from "./GetScheduleById";

export interface DuplicateScheduleInput {
  scheduleId: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  createdById: string;
}

export class DuplicateScheduleUseCase {
  execute(
    input: DuplicateScheduleInput,
  ): Effect.Effect<
    DuplicateScheduleResultDTO,
    ApplicationError | ScheduleNotFoundError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const original = yield* schedulePort.findById(input.scheduleId);
      if (!original) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      const now = new Date();
      const newStartDate = input.startDate ?? now;
      const durationMs =
        original.endDate.getTime() - original.startDate.getTime();
      const newEndDate =
        input.endDate ?? new Date(newStartDate.getTime() + durationMs);

      const created = yield* schedulePort.create({
        id: crypto.randomUUID(),
        name: input.name ?? `${original.name} (Copy)`,
        tripId: original.tripId,
        notificationType: original.notificationType,
        notificationTitle: original.notificationTitle,
        notificationBody: original.notificationBody,
        notificationUrl: original.notificationUrl,
        startDate: newStartDate,
        endDate: newEndDate,
        hour: original.hour,
        minute: original.minute,
        isActive: false,
        lastRun: null,
        createdById: input.createdById,
        createdAt: now,
        updatedAt: now,
      });

      return {
        schedule: {
          ...created,
          createdBy: null,
          trip: null,
          executionCount: 0,
        },
      };
    });
  }
}
