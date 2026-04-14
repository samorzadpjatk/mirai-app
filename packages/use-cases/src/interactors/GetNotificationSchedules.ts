import type {
  NotificationScheduleFilter,
  PaginationOptions,
} from "@mirai-app/domain";
import { NotificationSchedule } from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";

/**
 * Input for GetNotificationSchedules use case
 */
export interface GetNotificationSchedulesInput {
  filter?: NotificationScheduleFilter;
  pagination?: PaginationOptions;
}

/**
 * Schedule output DTO
 */
export interface NotificationScheduleOutput {
  id: string;
  name: string;
  tripId: string | null;
  notificationType: string;
  notificationTitle: string | null;
  notificationBody: string | null;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  createdById: string;
  lastRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isCurrentlyActive: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  formattedTime: string;
}

/**
 * Output for GetNotificationSchedules use case
 */
export interface GetNotificationSchedulesOutput {
  schedules: NotificationScheduleOutput[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Helper function to convert NotificationSchedule to output DTO
 */
function toOutput(
  schedule: NotificationSchedule,
  now: Date,
): NotificationScheduleOutput {
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
 * GetNotificationSchedules Use Case
 *
 * Retrieves a list of notification schedules with optional filtering and pagination.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getNotificationSchedulesUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationSchedulesUseCase(
  input: GetNotificationSchedulesInput,
): Effect.Effect<
  GetNotificationSchedulesOutput,
  never,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    const result = yield* repo.findAllPaginated({
      ...(input.filter !== undefined && { filter: input.filter }),
      ...(input.pagination !== undefined && { pagination: input.pagination }),
    });

    const now = new Date();

    return {
      schedules: result.items.map((schedule) => toOutput(schedule, now)),
      pagination: result.pagination,
    };
  });
}
