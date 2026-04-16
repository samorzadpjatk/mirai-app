import { NotificationSchedule } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for GetNotificationScheduleById use case
 */
export interface GetNotificationScheduleByIdInput {
  id: string;
}

/**
 * Output type alias for GetNotificationScheduleById
 */
export type GetNotificationScheduleByIdOutput = NotificationScheduleOutput;

/**
 * Error types for GetNotificationScheduleById use case
 */
export class GetScheduleNotFoundError extends Data.TaggedError(
  "GetScheduleNotFoundError",
)<{ id: string }> {}

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
 * GetNotificationScheduleById Use Case
 *
 * Retrieves a notification schedule by ID.
 * Returns error if schedule not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getNotificationScheduleByIdUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationScheduleByIdUseCase(
  input: GetNotificationScheduleByIdInput,
): Effect.Effect<
  GetNotificationScheduleByIdOutput,
  GetScheduleNotFoundError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    const schedule = yield* repo.findById(input.id);

    if (!schedule) {
      return yield* Effect.fail(new GetScheduleNotFoundError({ id: input.id }));
    }

    return toOutput(schedule);
  });
}
