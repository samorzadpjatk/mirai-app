import { Effect } from "effect";
import { NotificationScheduleId, TripId, type NotificationSchedule } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import {
  ScheduleNotFoundError,
} from "../../errors/NotificationErrors";

export interface UpdateScheduleInput {
  id: NotificationScheduleId;
  name?: string;
  tripId?: string;
  notificationType?: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

export class UpdateScheduleUseCase {
  execute(input: UpdateScheduleInput) {
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
        tripId: input.tripId !== undefined
          ? TripId.create(input.tripId)
          : existing.tripId,
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
      } as NotificationSchedule);

      return { ...updated, createdBy: null, trip: null, executionCount: 0 };
    });
  }
}
