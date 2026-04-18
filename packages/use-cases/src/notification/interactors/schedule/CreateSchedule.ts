import { Effect, Data, Either } from "effect";
import {
  NotificationScheduleId,
  TripId,
  UserId,
  type NotificationSchedule,
} from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { UserPortTag } from "../../../user/ports/UserPort";
import { TripPortTag } from "../../../trip/ports/TripPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  NotificationScheduleWithRelationsDTO,
  CreateScheduleInputDTO,
} from "../../dto/NotificationDTOs";
import { InvalidScheduleDatesError } from "../../errors/NotificationScheduleErrors";

// Re-export for index.ts
export { InvalidScheduleDatesError };

/**
 * User not found error
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

/**
 * Input for CreateScheduleUseCase
 */
export interface CreateScheduleInput extends CreateScheduleInputDTO {
  createdById: UserId;
}

/**
 * Create Schedule Use Case
 *
 * Creates a new notification schedule.
 */
export class CreateScheduleUseCase {
  execute(input: CreateScheduleInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;
      const userPort = yield* UserPortTag;
      const tripPort = yield* TripPortTag;

      // Validate dates
      if (input.startDate >= input.endDate) {
        return yield* Effect.fail(
          new InvalidScheduleDatesError({
            startDate: input.startDate,
            endDate: input.endDate,
            reason: "Start date must be before end date",
          }),
        );
      }

      const now = new Date();
      const schedule = yield* schedulePort.create({
        id: NotificationScheduleId.create(crypto.randomUUID()),
        name: input.name,
        tripId: input.tripId ? TripId.create(input.tripId) : null,
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
      } as NotificationSchedule);

      // Fetch related data in parallel with error handling
      const userEffect = Effect.either(userPort.findById(input.createdById));
      const tripEffect = schedule.tripId
        ? Effect.either(tripPort.findById(schedule.tripId))
        : Effect.succeed(null);

      const [userResult, tripResult] = yield* Effect.all([
        userEffect,
        tripEffect,
      ]);

      // Handle missing user (should exist since they created the schedule)
      if (Either.isLeft(userResult) || !userResult.right) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(input.createdById) }),
        );
      }
      const user = userResult.right;

      // Handle optional trip
      let trip = null;
      if (tripResult && tripResult !== null && typeof tripResult === "object" && "_tag" in tripResult) {
        if (Either.isRight(tripResult) && tripResult.right) {
          const tripEntity = tripResult.right as { id: TripId; name: string };
          trip = {
            id: tripEntity.id,
            name: tripEntity.name,
          };
        }
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
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: null,
        },
        trip,
        executionCount: 0,
      };
    });
  }
}
