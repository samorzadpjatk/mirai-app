import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  NotificationScheduleWithRelationsDTO,
  UpdateScheduleInputDTO,
} from "../../dto/NotificationDTOs";
import { ScheduleNotFoundError } from "./GetScheduleById";

export interface UpdateScheduleInput extends UpdateScheduleInputDTO {}

export class UpdateScheduleUseCase {
  execute(
    input: UpdateScheduleInput,
  ): Effect.Effect<
    NotificationScheduleWithRelationsDTO,
    ApplicationError | ScheduleNotFoundError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const existing = yield* schedulePort.findById(input.id);
      if (!existing) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.id }),
        );
      }

      const now = new Date();
      const updated = yield* schedulePort.update({
        ...existing,
        name: input.name ?? existing.name,
        tripId: input.tripId !== undefined ? input.tripId : existing.tripId,
        notificationType: input.notificationType ?? existing.notificationType,
        notificationTitle:
          input.notificationTitle !== undefined
            ? input.notificationTitle
            : existing.notificationTitle,
        notificationBody:
          input.notificationBody !== undefined
            ? input.notificationBody
            : existing.notificationBody,
        notificationUrl:
          input.notificationUrl !== undefined
            ? input.notificationUrl
            : existing.notificationUrl,
        startDate: input.startDate ?? existing.startDate,
        endDate: input.endDate ?? existing.endDate,
        hour: input.hour ?? existing.hour,
        minute: input.minute ?? existing.minute,
        isActive: input.isActive ?? existing.isActive,
        updatedAt: now,
      });

      return { ...updated, createdBy: null, trip: null, executionCount: 0 };
    });
  }
}
