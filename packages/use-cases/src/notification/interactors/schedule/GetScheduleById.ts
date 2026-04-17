import { Effect, Data } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { NotificationScheduleWithRelationsDTO } from "../../dto/NotificationDTOs";

/**
 * Schedule not found error
 */
export class ScheduleNotFoundError extends Data.TaggedError(
  "ScheduleNotFoundError",
)<{
  scheduleId: string;
}>() {}

/**
 * Input for GetScheduleByIdUseCase
 */
export interface GetScheduleByIdInput {
  scheduleId: string;
}

/**
 * Get Schedule By ID Use Case
 *
 * Retrieves a notification schedule by ID with relations.
 */
export class GetScheduleByIdUseCase {
  execute(
    input: GetScheduleByIdInput,
  ): Effect.Effect<
    NotificationScheduleWithRelationsDTO,
    ApplicationError | ScheduleNotFoundError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const schedule = yield* schedulePort.findById(input.scheduleId);

      if (!schedule) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      return {
        id: schedule.id,
        name: schedule.name,
        tripId: schedule.tripId,
        notificationType: schedule.notificationType,
        notificationTitle: schedule.notificationTitle,
        notificationBody: schedule.notificationBody,
        notificationUrl: schedule.notificationUrl,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        hour: schedule.hour,
        minute: schedule.minute,
        isActive: schedule.isActive,
        lastRun: schedule.lastRun,
        createdById: schedule.createdById,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        createdBy: null, // To be hydrated by adapter
        trip: null, // To be hydrated by adapter
        executionCount: 0, // To be hydrated by adapter
      };
    });
  }
}
