import { Effect, Data } from "effect";
import {
  NotificationScheduleGatewayTag,
  type NotificationScheduleExecutionRecord,
} from "../../ports/schedule/gateway";
import type { NotificationSchedule } from "@mirai-app/domain";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for DuplicateNotificationSchedule use case
 */
export interface DuplicateNotificationScheduleInput {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  newCreatedById: string;
}

/**
 * Output for DuplicateNotificationSchedule use case
 */
export interface DuplicateNotificationScheduleOutput {
  schedule: NotificationScheduleOutput;
}

/**
 * Error types for DuplicateNotificationSchedule use case
 */
export class DuplicateScheduleNotFoundError extends Data.TaggedError(
  "DuplicateScheduleNotFoundError",
)<{ id: string }> {}

export class DuplicateScheduleError extends Data.TaggedError(
  "DuplicateScheduleError",
)<{ message: string }> {}

/**
 * Helper function to convert NotificationSchedule to output DTO
 */
function toOutput(schedule: NotificationSchedule): NotificationScheduleOutput {
  const now = new Date();
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
    createdById: schedule.createdById,
    lastRun: schedule.lastRun,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    isCurrentlyActive: schedule.isCurrentlyActive(now),
    isExpired: schedule.isExpired(now),
    isUpcoming: schedule.isUpcoming(now),
    formattedTime: schedule.getFormattedTime(),
  };
}

/**
 * DuplicateNotificationSchedule Use Case
 *
 * Creates a copy of an existing notification schedule.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = duplicateNotificationScheduleUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function duplicateNotificationScheduleUseCase(
  input: DuplicateNotificationScheduleInput,
): Effect.Effect<
  DuplicateNotificationScheduleOutput,
  DuplicateScheduleNotFoundError | DuplicateScheduleError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    // Find the original schedule
    const original = yield* repo.findById(input.id);

    if (!original) {
      return yield* Effect.fail(
        new DuplicateScheduleNotFoundError({ id: input.id }),
      );
    }

    // Create duplicate using domain method
    const duplicateResult = yield* original
      .duplicate({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        newCreatedById: input.newCreatedById,
      })
      .pipe(
        Effect.mapError(
          (validationError) =>
            new DuplicateScheduleError({
              message: validationError.message,
            }),
        ),
      );

    // Save to repository
    const saved = yield* repo.create(duplicateResult);

    return {
      schedule: toOutput(saved),
    };
  });
}
