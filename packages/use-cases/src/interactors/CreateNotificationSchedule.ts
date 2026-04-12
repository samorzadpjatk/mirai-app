import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for CreateNotificationSchedule use case
 */
export interface CreateNotificationScheduleInput {
  name: string;
  tripId?: string | null;
  notificationType: NotificationScheduleType;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive?: boolean;
  createdById: string;
}

/**
 * Output type alias for CreateNotificationSchedule
 */
export type CreateNotificationScheduleOutput = NotificationScheduleOutput;

/**
 * Error types for CreateNotificationSchedule use case
 */
export class DuplicateScheduleNameError extends Error {
  readonly _tag = "DuplicateScheduleNameError";
  constructor(name: string) {
    super(`A schedule with the name "${name}" already exists for this trip`);
  }
}

export class ScheduleValidationError extends Error {
  readonly _tag = "ScheduleValidationError";
  constructor(message: string) {
    super(message);
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
 * CreateNotificationSchedule Use Case
 *
 * Creates a new notification schedule with validation.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = createNotificationScheduleUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function createNotificationScheduleUseCase(
  input: CreateNotificationScheduleInput,
): Effect.Effect<
  CreateNotificationScheduleOutput,
  DuplicateScheduleNameError | ScheduleValidationError,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    // Check for duplicate name in the same trip
    if (input.tripId) {
      const existing = yield* repo.findByTripIdAndName(
        input.tripId,
        input.name,
      );

      if (existing) {
        return yield* Effect.fail(new DuplicateScheduleNameError(input.name));
      }
    }

    // Create the domain entity (validation happens here)
    const createResult = NotificationSchedule.create({
      name: input.name,
      ...(input.tripId !== undefined && { tripId: input.tripId }),
      notificationType: input.notificationType,
      ...(input.notificationTitle !== undefined && {
        notificationTitle: input.notificationTitle,
      }),
      ...(input.notificationBody !== undefined && {
        notificationBody: input.notificationBody,
      }),
      ...(input.notificationUrl !== undefined && {
        notificationUrl: input.notificationUrl,
      }),
      startDate: input.startDate,
      endDate: input.endDate,
      hour: input.hour,
      minute: input.minute,
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      createdById: input.createdById,
    });

    if (createResult.kind === "err") {
      return yield* Effect.fail(
        new ScheduleValidationError(createResult.error),
      );
    }

    const schedule = createResult.value;

    // Save to repository
    const saved = yield* repo.create(schedule);

    return toOutput(saved);
  });
}
