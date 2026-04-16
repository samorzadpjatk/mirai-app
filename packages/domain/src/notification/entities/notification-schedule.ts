import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { NotificationScheduleType } from "../../notification/enums";

/**
 * Validation rules for notification schedule data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 100,
  },
  notificationTitle: {
    minLength: 1,
    maxLength: 200,
  },
  notificationBody: {
    minLength: 1,
    maxLength: 2000,
  },
  notificationUrl: {
    maxLength: 500,
  },
  duration: {
    minDays: 1,
    maxDays: 365,
  },
  time: {
    minHour: 0,
    maxHour: 23,
    minMinute: 0,
    maxMinute: 59,
  },
};

/**
 * Normalize schedule window to UTC time
 */
export function normalizeScheduleWindow(params: {
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
}): {
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
} {
  const normalizedStartDate = new Date(params.startDate);
  normalizedStartDate.setUTCHours(params.hour, params.minute, 0, 0);

  const durationMs = params.endDate.getTime() - params.startDate.getTime();
  const normalizedEndDate = new Date(
    normalizedStartDate.getTime() + durationMs,
  );

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hour: normalizedStartDate.getUTCHours(),
    minute: normalizedStartDate.getUTCMinutes(),
  };
}

/**
 * Get next scheduled start date based on current time
 * Ensures the schedule is at least 5 minutes in the future
 */
export function getNextScheduledStartDate(
  hour: number,
  minute: number,
  now = new Date(),
): Date {
  const startDate = new Date(now);
  startDate.setHours(hour, minute, 0, 0);

  const minimumDate = new Date(now.getTime() + 5 * 60 * 1000);
  if (startDate < minimumDate) {
    startDate.setDate(startDate.getDate() + 1);
  }

  return startDate;
}

/**
 * Filter options for listing schedules
 */
export interface NotificationScheduleFilter {
  tripId?: string | null;
  notificationType?: NotificationScheduleType;
  isActive?: boolean;
  startDateFrom?: Date;
  startDateTo?: Date;
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * NotificationSchedule entity - represents a scheduled notification campaign
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class NotificationSchedule {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tripId: string | null,
    public readonly notificationType: NotificationScheduleType,
    public readonly notificationTitle: string | null,
    public readonly notificationBody: string | null,
    public readonly notificationUrl: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly hour: number,
    public readonly minute: number,
    public readonly isActive: boolean,
    public readonly createdById: string,
    public readonly lastRun: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new NotificationSchedule
   * Validates all input data
   */
  static create(props: {
    id?: string;
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
    lastRun?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<NotificationSchedule, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate name
      if (!props.name || props.name.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "name is required",
            field: "name",
          }),
        );
      }
      if (props.name.length > VALIDATION_RULES.name.maxLength) {
        return yield* Effect.fail(
          new ValidationError({
            message: `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
            field: "name",
          }),
        );
      }

      // Validate notification content
      if (props.notificationType !== NotificationScheduleType.INFO) {
        if (!props.notificationTitle || props.notificationTitle.trim() === "") {
          return yield* Effect.fail(
            new ValidationError({
              message:
                "notificationTitle is required for this notification type",
              field: "notificationTitle",
            }),
          );
        }

        if (
          props.notificationTitle.length >
          VALIDATION_RULES.notificationTitle.maxLength
        ) {
          return yield* Effect.fail(
            new ValidationError({
              message: `notificationTitle must be at most ${VALIDATION_RULES.notificationTitle.maxLength} characters`,
              field: "notificationTitle",
            }),
          );
        }

        if (!props.notificationBody || props.notificationBody.trim() === "") {
          return yield* Effect.fail(
            new ValidationError({
              message:
                "notificationBody is required for this notification type",
              field: "notificationBody",
            }),
          );
        }

        if (
          props.notificationBody.length >
          VALIDATION_RULES.notificationBody.maxLength
        ) {
          return yield* Effect.fail(
            new ValidationError({
              message: `notificationBody must be at most ${VALIDATION_RULES.notificationBody.maxLength} characters`,
              field: "notificationBody",
            }),
          );
        }

        if (
          props.notificationUrl !== null &&
          props.notificationUrl !== undefined &&
          props.notificationUrl.length >
            VALIDATION_RULES.notificationUrl.maxLength
        ) {
          return yield* Effect.fail(
            new ValidationError({
              message: `notificationUrl must be at most ${VALIDATION_RULES.notificationUrl.maxLength} characters`,
              field: "notificationUrl",
            }),
          );
        }
      }

      // Validate hour and minute ranges BEFORE normalization
      if (
        props.hour < VALIDATION_RULES.time.minHour ||
        props.hour > VALIDATION_RULES.time.maxHour
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: `hour must be between ${VALIDATION_RULES.time.minHour} and ${VALIDATION_RULES.time.maxHour}`,
            field: "hour",
          }),
        );
      }

      if (
        props.minute < VALIDATION_RULES.time.minMinute ||
        props.minute > VALIDATION_RULES.time.maxMinute
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: `minute must be between ${VALIDATION_RULES.time.minMinute} and ${VALIDATION_RULES.time.maxMinute}`,
            field: "minute",
          }),
        );
      }

      // Normalize schedule window
      const normalized = normalizeScheduleWindow({
        startDate: props.startDate,
        endDate: props.endDate,
        hour: props.hour,
        minute: props.minute,
      });

      // Validate date range
      if (normalized.startDate >= normalized.endDate) {
        return yield* Effect.fail(
          new ValidationError({
            message: "startDate must be before endDate",
            field: "startDate/endDate",
          }),
        );
      }

      // Validate future dates
      const now = Date.now();
      if (normalized.startDate.getTime() < now) {
        return yield* Effect.fail(
          new ValidationError({
            message: "startDate must be in the future",
            field: "startDate",
          }),
        );
      }

      if (normalized.endDate.getTime() < now) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endDate must be in the future",
            field: "endDate",
          }),
        );
      }

      // Validate reasonable date range
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);

      if (normalized.startDate.getTime() > maxFutureDate.getTime()) {
        return yield* Effect.fail(
          new ValidationError({
            message: "startDate cannot be more than 2 years in the future",
            field: "startDate",
          }),
        );
      }

      if (normalized.endDate.getTime() > maxFutureDate.getTime()) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endDate cannot be more than 2 years in the future",
            field: "endDate",
          }),
        );
      }

      // Validate minimum duration
      const durationMs =
        normalized.endDate.getTime() - normalized.startDate.getTime();
      const minDurationMs = 24 * 60 * 60 * 1000; // 1 day
      if (durationMs < minDurationMs) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Duration must be at least 1 day",
            field: "startDate/endDate",
          }),
        );
      }

      // Validate schedule time
      const minScheduledTime = new Date(now + 5 * 60 * 1000);
      if (normalized.startDate < minScheduledTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Schedule time must be at least 5 minutes in the future",
            field: "startDate",
          }),
        );
      }

      // Validate createdById
      if (!props.createdById || props.createdById.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "createdById is required",
            field: "createdById",
          }),
        );
      }

      const timestamp = new Date();

      return new NotificationSchedule(
        props.id ?? crypto.randomUUID(),
        props.name.trim(),
        props.tripId ?? null,
        props.notificationType,
        props.notificationTitle ?? null,
        props.notificationBody ?? null,
        props.notificationUrl ?? null,
        normalized.startDate,
        normalized.endDate,
        normalized.hour,
        normalized.minute,
        props.isActive ?? true,
        props.createdById.trim(),
        props.lastRun ?? null,
        props.createdAt ?? timestamp,
        props.updatedAt ?? timestamp,
      );
    });
  }

  /**
   * Update schedule properties
   * Returns a new NotificationSchedule instance (immutable)
   */
  update(props: {
    name?: string;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    startDate?: Date;
    endDate?: Date;
    hour?: number;
    minute?: number;
    isActive?: boolean;
  }): Effect.Effect<NotificationSchedule, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      if (props.name !== undefined) {
        if (props.name.trim() === "") {
          return yield* Effect.fail(
            new ValidationError({
              message: "name is required",
              field: "name",
            }),
          );
        }
        if (props.name.length > VALIDATION_RULES.name.maxLength) {
          return yield* Effect.fail(
            new ValidationError({
              message: `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
              field: "name",
            }),
          );
        }
      }

      const baseStartDate = props.startDate ?? self.startDate;
      const baseEndDate = props.endDate ?? self.endDate;
      const baseHour = props.hour ?? self.hour;
      const baseMinute = props.minute ?? self.minute;

      // Check if we need to re-normalize
      const shouldNormalize =
        props.startDate !== undefined ||
        props.endDate !== undefined ||
        props.hour !== undefined ||
        props.minute !== undefined;

      let normalized = shouldNormalize
        ? normalizeScheduleWindow({
            startDate: baseStartDate,
            endDate: baseEndDate,
            hour: baseHour,
            minute: baseMinute,
          })
        : null;

      const finalStartDate = normalized?.startDate ?? baseStartDate;
      const finalEndDate = normalized?.endDate ?? baseEndDate;
      const finalHour = normalized?.hour ?? baseHour;
      const finalMinute = normalized?.minute ?? baseMinute;

      // Validate dates if changed
      if (shouldNormalize) {
        if (finalStartDate >= finalEndDate) {
          return yield* Effect.fail(
            new ValidationError({
              message: "startDate must be before endDate",
              field: "startDate/endDate",
            }),
          );
        }

        const now = Date.now();
        const graceTime = 60 * 1000; // 1 minute grace period for updates

        if (finalStartDate.getTime() < now - graceTime) {
          return yield* Effect.fail(
            new ValidationError({
              message: "startDate must be in the future",
              field: "startDate",
            }),
          );
        }

        if (finalEndDate.getTime() < now - graceTime) {
          return yield* Effect.fail(
            new ValidationError({
              message: "endDate must be in the future",
              field: "endDate",
            }),
          );
        }

        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
        const dayGrace = 24 * 60 * 60 * 1000;

        if (finalStartDate.getTime() > maxFutureDate.getTime() + dayGrace) {
          return yield* Effect.fail(
            new ValidationError({
              message: "startDate cannot be more than 2 years in the future",
              field: "startDate",
            }),
          );
        }

        if (finalEndDate.getTime() > maxFutureDate.getTime() + dayGrace) {
          return yield* Effect.fail(
            new ValidationError({
              message: "endDate cannot be more than 2 years in the future",
              field: "endDate",
            }),
          );
        }

        const durationMs = finalEndDate.getTime() - finalStartDate.getTime();
        const minDurationMs = 24 * 60 * 60 * 1000;
        if (durationMs < minDurationMs) {
          return yield* Effect.fail(
            new ValidationError({
              message: "Duration must be at least 1 day",
              field: "startDate/endDate",
            }),
          );
        }

        // Only validate schedule time if start date is in the future
        if (finalStartDate > new Date()) {
          const minScheduledTime = new Date(Date.now() + 5 * 60 * 1000);
          if (finalStartDate < minScheduledTime) {
            return yield* Effect.fail(
              new ValidationError({
                message:
                  "Schedule time must be at least 5 minutes in the future",
                field: "startDate",
              }),
            );
          }
        }
      }

      const finalTitle =
        props.notificationTitle !== undefined
          ? props.notificationTitle
          : self.notificationTitle;
      const finalBody =
        props.notificationBody !== undefined
          ? props.notificationBody
          : self.notificationBody;
      const finalUrl =
        props.notificationUrl !== undefined
          ? props.notificationUrl
          : self.notificationUrl;

      if (
        props.notificationTitle !== undefined ||
        props.notificationBody !== undefined ||
        props.notificationUrl !== undefined
      ) {
        if (self.notificationType !== NotificationScheduleType.INFO) {
          if (!finalTitle || finalTitle.trim() === "") {
            return yield* Effect.fail(
              new ValidationError({
                message:
                  "notificationTitle is required for this notification type",
                field: "notificationTitle",
              }),
            );
          }

          if (
            finalTitle.length > VALIDATION_RULES.notificationTitle.maxLength
          ) {
            return yield* Effect.fail(
              new ValidationError({
                message: `notificationTitle must be at most ${VALIDATION_RULES.notificationTitle.maxLength} characters`,
                field: "notificationTitle",
              }),
            );
          }

          if (!finalBody || finalBody.trim() === "") {
            return yield* Effect.fail(
              new ValidationError({
                message:
                  "notificationBody is required for this notification type",
                field: "notificationBody",
              }),
            );
          }

          if (finalBody.length > VALIDATION_RULES.notificationBody.maxLength) {
            return yield* Effect.fail(
              new ValidationError({
                message: `notificationBody must be at most ${VALIDATION_RULES.notificationBody.maxLength} characters`,
                field: "notificationBody",
              }),
            );
          }

          if (finalUrl !== null && finalUrl !== undefined) {
            if (finalUrl.length > VALIDATION_RULES.notificationUrl.maxLength) {
              return yield* Effect.fail(
                new ValidationError({
                  message: `notificationUrl must be at most ${VALIDATION_RULES.notificationUrl.maxLength} characters`,
                  field: "notificationUrl",
                }),
              );
            }
          }
        }
      }

      return new NotificationSchedule(
        self.id,
        props.name ?? self.name,
        self.tripId,
        self.notificationType,
        finalTitle,
        finalBody,
        finalUrl,
        finalStartDate,
        finalEndDate,
        finalHour,
        finalMinute,
        props.isActive ?? self.isActive,
        self.createdById,
        self.lastRun,
        self.createdAt,
        new Date(),
      );
    });
  }

  /**
   * Toggle the active status
   * Returns a new NotificationSchedule instance (immutable)
   */
  toggleActive(): NotificationSchedule {
    return new NotificationSchedule(
      this.id,
      this.name,
      this.tripId,
      this.notificationType,
      this.notificationTitle,
      this.notificationBody,
      this.notificationUrl,
      this.startDate,
      this.endDate,
      this.hour,
      this.minute,
      !this.isActive,
      this.createdById,
      this.lastRun,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update last run timestamp
   * Returns a new NotificationSchedule instance (immutable)
   */
  updateLastRun(lastRun: Date): NotificationSchedule {
    return new NotificationSchedule(
      this.id,
      this.name,
      this.tripId,
      this.notificationType,
      this.notificationTitle,
      this.notificationBody,
      this.notificationUrl,
      this.startDate,
      this.endDate,
      this.hour,
      this.minute,
      this.isActive,
      this.createdById,
      lastRun,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Create a duplicate of this schedule
   * Returns a new NotificationSchedule instance with new dates
   */
  duplicate(params: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    newCreatedById: string;
  }): Effect.Effect<NotificationSchedule, ValidationError, never> {
    const newStartDate = params.startDate ?? this.startDate;
    const durationMs = this.endDate.getTime() - this.startDate.getTime();
    const newEndDate =
      params.endDate ?? new Date(newStartDate.getTime() + durationMs);

    return NotificationSchedule.create({
      name: params.name ?? `${this.name} (Copy)`,
      tripId: this.tripId,
      notificationType: this.notificationType,
      notificationTitle: this.notificationTitle,
      notificationBody: this.notificationBody,
      notificationUrl: this.notificationUrl,
      startDate: newStartDate,
      endDate: newEndDate,
      hour: this.hour,
      minute: this.minute,
      isActive: false, // Duplicates are inactive by default
      createdById: params.newCreatedById,
    });
  }

  /**
   * Check if the schedule is currently active
   * (isActive flag is true AND current time is within the schedule window)
   */
  isCurrentlyActive(now = new Date()): boolean {
    if (!this.isActive) {
      return false;
    }
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Check if the schedule has expired (current time is past endDate)
   */
  isExpired(now = new Date()): boolean {
    return now > this.endDate;
  }

  /**
   * Check if the schedule is upcoming (current time is before startDate)
   */
  isUpcoming(now = new Date()): boolean {
    return now < this.startDate;
  }

  /**
   * Check if the schedule should run now based on hour/minute
   */
  shouldRunAt(date: Date): boolean {
    return (
      date.getUTCHours() === this.hour && date.getUTCMinutes() === this.minute
    );
  }

  /**
   * Get the next scheduled run time after a given date
   */
  getNextRunTime(after = new Date()): Date | null {
    if (this.isExpired(after)) {
      return null;
    }

    const nextRun = new Date(after);
    nextRun.setUTCHours(this.hour, this.minute, 0, 0);

    if (nextRun <= after) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Check if the next run is within the schedule window
    if (nextRun > this.endDate) {
      return null;
    }

    return nextRun;
  }

  /**
   * Get the duration of the schedule in milliseconds
   */
  getDurationMs(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }

  /**
   * Get the duration of the schedule in days
   */
  getDurationDays(): number {
    return Math.round(this.getDurationMs() / (24 * 60 * 60 * 1000));
  }

  /**
   * Check if this is a daily ranking schedule
   */
  isDailyRanking(): boolean {
    return this.notificationType === NotificationScheduleType.DAILY_RANKING;
  }

  /**
   * Check if this schedule is tied to a specific trip
   */
  isTripSpecific(): boolean {
    return this.tripId !== null;
  }

  /**
   * Check if this schedule has notification content
   */
  hasContent(): boolean {
    return this.notificationTitle !== null && this.notificationBody !== null;
  }

  /**
   * Check if this schedule has a URL
   */
  hasUrl(): boolean {
    return this.notificationUrl !== null && this.notificationUrl !== "";
  }

  /**
   * Get formatted time string (HH:MM)
   */
  getFormattedTime(): string {
    return `${String(this.hour).padStart(2, "0")}:${String(this.minute).padStart(2, "0")}`;
  }

  /**
   * Get summary for display
   */
  getSummary(): string {
    const time = this.getFormattedTime();
    const type = this.notificationType;
    const active = this.isActive ? "active" : "inactive";
    return `${this.name} (${type}) at ${time} - ${active}`;
  }
}
