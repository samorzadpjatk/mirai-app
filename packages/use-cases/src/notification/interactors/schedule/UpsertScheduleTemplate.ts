import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { TripPortTag } from "../../../trip/ports/TripPort";
import { TripNotFoundError } from "../../../trip/errors/TripErrors";

/**
 * Input for UpsertScheduleTemplateUseCase
 */
export interface UpsertScheduleTemplateInput {
  tripId: string;
  templateKey: "daily_morning" | "daily_evening";
  createdById: string;
}

const TEMPLATES: Record<
  string,
  { name: string; notificationType: string; hour: number; minute: number }
> = {
  daily_morning: {
    name: "Daily Morning Ranking Update",
    notificationType: "RANKING_UPDATE",
    hour: 8,
    minute: 0,
  },
  daily_evening: {
    name: "Daily Evening Ranking Update",
    notificationType: "RANKING_UPDATE",
    hour: 18,
    minute: 0,
  },
};

/**
 * Upsert Schedule Template Use Case
 */
export class UpsertScheduleTemplateUseCase {
  execute(input: UpsertScheduleTemplateInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;
      const tripPort = yield* TripPortTag;

      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      const template = TEMPLATES[input.templateKey];
      const now = new Date();
      const existingSchedule = yield* schedulePort.findByTripIdAndName(
        input.tripId,
        template.name,
      );

      const startDate = new Date();
      startDate.setHours(template.hour, template.minute, 0, 0);
      const endDate = new Date(now.getFullYear() + 1, 11, 31);

      if (existingSchedule) {
        const updated = yield* schedulePort.update({
          ...existingSchedule,
          hour: template.hour,
          minute: template.minute,
          startDate,
          endDate,
          isActive: true,
          updatedAt: now,
        });

        return {
          action: "updated" as const,
          schedule: {
            ...updated,
            createdBy: null,
            trip: null,
            executionCount: 0,
          },
        };
      }

      const created = yield* schedulePort.create({
        id: crypto.randomUUID(),
        tripId: input.tripId,
        name: template.name,
        notificationType: template.notificationType,
        notificationTitle: "Ranking Update",
        notificationBody: "Check the latest rankings!",
        notificationUrl: "/ranking",
        startDate,
        endDate,
        hour: template.hour,
        minute: template.minute,
        isActive: true,
        lastRun: null,
        createdById: input.createdById,
        createdAt: now,
        updatedAt: now,
      });

      return {
        action: "created" as const,
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
