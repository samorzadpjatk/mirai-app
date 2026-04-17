import { Effect, Data } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  NotificationScheduleWithRelationsDTO,
  CreateScheduleInputDTO,
} from "../../dto/NotificationDTOs";

/**
 * Invalid schedule dates error
 */
export class InvalidScheduleDatesError extends Data.TaggedError(
  "InvalidScheduleDatesError",
)<{
  reason: string;
}>() {}

/**
 * Input for CreateScheduleUseCase
 */
export interface CreateScheduleInput extends CreateScheduleInputDTO {
  createdById: string;
}

/**
 * Create Schedule Use Case
 *
 * Creates a new notification schedule.
 */
export class CreateScheduleUseCase {
  execute(
    input: CreateScheduleInput,
  ): Effect.Effect<
    NotificationScheduleWithRelationsDTO,
    ApplicationError | InvalidScheduleDatesError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      // Validate dates
      if (input.startDate >= input.endDate) {
        return yield* Effect.fail(
          new InvalidScheduleDatesError({
            reason: "Start date must be before end date",
          }),
        );
      }

      const now = new Date();
      const schedule = yield* schedulePort.create({
        id: crypto.randomUUID(),
        name: input.name,
        tripId: input.tripId,
        notificationType: input.notificationType,
        notificationTitle: input.notificationTitle,
        notificationBody: input.notificationBody,
        notificationUrl: input.notificationUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        hour: input.hour,
        minute: input.minute,
        isActive: input.isActive,
        lastRun: null,
        createdById: input.createdById,
        createdAt: now,
        updatedAt: now,
      });

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
        executionCount: 0,
      };
    });
  }
}
