import { NotificationSchedule } from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

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
export class GetScheduleNotFoundError extends Error {
  readonly _tag = "GetScheduleNotFoundError";
  constructor() {
    super("Notification schedule not found");
  }
}

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
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationScheduleByIdUseCase(
  input: GetNotificationScheduleByIdInput,
): Effect.Effect<
  GetNotificationScheduleByIdOutput,
  GetScheduleNotFoundError,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    const schedule = yield* repo.findById(input.id);

    if (!schedule) {
      return yield* Effect.fail(new GetScheduleNotFoundError());
    }

    return toOutput(schedule);
  });
}
