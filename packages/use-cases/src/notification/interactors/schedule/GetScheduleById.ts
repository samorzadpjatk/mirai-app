import { Effect, Data } from "effect";
import {
  NotificationScheduleId,
  UserId,
  TripId,
} from "@mirai-app/domain";
import {
  NotificationSchedulePortTag,
  NotificationScheduleExecutionPortTag,
} from "../../ports/NotificationPort";
import { UserPortTag } from "../../../user/ports/UserPort";
import { TripPortTag } from "../../../trip/ports/TripPort";
import { ScheduleNotFoundError } from "../../errors/NotificationErrors";

/**
 * Input for GetScheduleByIdUseCase
 */
export interface GetScheduleByIdInput {
  scheduleId: NotificationScheduleId;
}

/**
 * Error when user referenced by schedule is not found
 */
export class ScheduleUserNotFoundError extends Data.TaggedError(
  "ScheduleUserNotFoundError",
)<{
  userId: string;
}> {}

/**
 * Error when trip referenced by schedule is not found
 */
export class ScheduleTripNotFoundError extends Data.TaggedError(
  "ScheduleTripNotFoundError",
)<{
  tripId: string;
}> {}

/**
 * Get Schedule By ID Use Case
 *
 * Retrieves a notification schedule by ID with fully-populated relations.
 */
export class GetScheduleByIdUseCase {
  execute(input: GetScheduleByIdInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;
      const userPort = yield* UserPortTag;
      const tripPort = yield* TripPortTag;
      const executionPort = yield* NotificationScheduleExecutionPortTag;

      const schedule = yield* schedulePort.findById(input.scheduleId);

      if (!schedule) {
        return yield* Effect.fail(
          new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
        );
      }

      // Parallel fetch of all related data
      const createdByTask = userPort.findById(
        UserId.unsafeCreate(schedule.createdById),
      );
      const tripTask = schedule.tripId
        ? tripPort.findById(schedule.tripId)
        : Effect.succeed(null);
      const executionsTask = executionPort.findByScheduleId(schedule.id, 10000);

      const [createdBy, trip, executions] = yield* Effect.all([
        createdByTask,
        tripTask,
        executionsTask,
      ]);

      // Handle missing entities
      if (!createdBy) {
        return yield* Effect.fail(
          new ScheduleUserNotFoundError({ userId: schedule.createdById }),
        );
      }

      // Only fail if trip was expected but not found
      if (schedule.tripId && !trip) {
        return yield* Effect.fail(
          new ScheduleTripNotFoundError({
            tripId: TripId.toString(schedule.tripId),
          }),
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
        createdBy: {
          id: createdBy.id,
          firstName: createdBy.firstName,
          lastName: createdBy.lastName,
          fullName: createdBy.getFullName(),
        },
        trip: trip
          ? {
              id: trip.id,
              name: trip.name,
            }
          : null,
        executionCount: executions.length,
      };
    });
  }
}
