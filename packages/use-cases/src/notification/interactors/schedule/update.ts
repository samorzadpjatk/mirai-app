import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for UpdateNotificationSchedule use case
 */
export interface UpdateNotificationScheduleInput {
  id: string;
  name?: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

/**
 * Output type alias for UpdateNotificationSchedule
 */
export type UpdateNotificationScheduleOutput = NotificationScheduleOutput;

/**
 * Error types for UpdateNotificationSchedule use case
 */
export class UpdateScheduleNotFoundError extends Data.TaggedError(
  "UpdateScheduleNotFoundError",
)<{ id: string }> {}

export class UpdateScheduleValidationError extends Data.TaggedError(
  "UpdateScheduleValidationError",
)<{ message: string }> {}

/**
 * Helper function to convert NotificationSchedule to output DTO
 */
function toOutput(
  schedule: import("@mirai-app/domain").NotificationSchedule,
): NotificationScheduleOutput {
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
 * UpdateNotificationSchedule Use Case
 *
 * Updates an existing notification schedule.
 * Returns error if schedule not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = updateNotificationScheduleUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateNotificationScheduleUseCase(
  input: UpdateNotificationScheduleInput,
): Effect.Effect<
  UpdateNotificationScheduleOutput,
  UpdateScheduleNotFoundError | UpdateScheduleValidationError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    // Find the existing schedule
    const existing = yield* repo.findById(input.id);

    if (!existing) {
      return yield* Effect.fail(
        new UpdateScheduleNotFoundError({ id: input.id }),
      );
    }

    // Apply updates using domain entity method (validation happens here)
    const updateResult = existing.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.notificationTitle !== undefined && {
        notificationTitle: input.notificationTitle,
      }),
      ...(input.notificationBody !== undefined && {
        notificationBody: input.notificationBody,
      }),
      ...(input.notificationUrl !== undefined && {
        notificationUrl: input.notificationUrl,
      }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.hour !== undefined && { hour: input.hour }),
      ...(input.minute !== undefined && { minute: input.minute }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    const updated = yield* updateResult.pipe(
      Effect.mapError(
        (validationError) =>
          new UpdateScheduleValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Save to repository
    const saved = yield* repo.update(updated);

    return toOutput(saved);
  });
}
