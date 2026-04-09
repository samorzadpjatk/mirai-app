import { type Result, ok, err, isError } from "../utils/result";

/**
 * Notification types for scheduled notifications
 */
export enum NotificationScheduleType {
  CHALLENGE = "CHALLENGE",
  INFO = "INFO",
  REMINDER = "REMINDER",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  DAILY_RANKING = "DAILY_RANKING",
}

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
 * Validate date range (startDate < endDate)
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
): Result<void, string> {
  if (startDate >= endDate) {
    return err("startDate must be before endDate");
  }
  return ok(undefined);
}

/**
 * Validate dates are in the future (with optional grace period for updates)
 */
export function validateFutureDates(
  startDate: Date,
  endDate: Date,
  allowGracePeriod = false,
): Result<void, string> {
  const now = new Date();
  const graceTime = allowGracePeriod ? 60 * 1000 : 0; // 1 minute grace period for updates

  if (startDate.getTime() < now.getTime() - graceTime) {
    return err("startDate must be in the future");
  }

  if (endDate.getTime() < now.getTime() - graceTime) {
    return err("endDate must be in the future");
  }

  return ok(undefined);
}

/**
 * Validate reasonable date range (not too far in the future)
 */
export function validateReasonableDateRange(
  startDate: Date,
  endDate: Date,
  allowGracePeriod = false,
): Result<void, string> {
  const now = new Date();
  const maxFutureDate = new Date(now);
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);

  const graceTime = allowGracePeriod ? 24 * 60 * 60 * 1000 : 0; // 1 day grace for updates

  if (startDate.getTime() > maxFutureDate.getTime() + graceTime) {
    return err("startDate cannot be more than 2 years in the future");
  }

  if (endDate.getTime() > maxFutureDate.getTime() + graceTime) {
    return err("endDate cannot be more than 2 years in the future");
  }

  return ok(undefined);
}

/**
 * Validate minimum duration (at least 1 day)
 */
export function validateMinimumDuration(
  startDate: Date,
  endDate: Date,
): Result<void, string> {
  const durationMs = endDate.getTime() - startDate.getTime();
  const minDurationMs = 24 * 60 * 60 * 1000; // 1 day

  if (durationMs < minDurationMs) {
    return err("Duration must be at least 1 day");
  }

  return ok(undefined);
}

/**
 * Validate schedule time (hour, minute within valid ranges)
 */
export function validateScheduleTime(
  startDate: Date,
  hour: number,
  minute: number,
): Result<void, string> {
  if (
    hour < VALIDATION_RULES.time.minHour ||
    hour > VALIDATION_RULES.time.maxHour
  ) {
    return err(
      `hour must be between ${VALIDATION_RULES.time.minHour} and ${VALIDATION_RULES.time.maxHour}`,
    );
  }

  if (
    minute < VALIDATION_RULES.time.minMinute ||
    minute > VALIDATION_RULES.time.maxMinute
  ) {
    return err(
      `minute must be between ${VALIDATION_RULES.time.minMinute} and ${VALIDATION_RULES.time.maxMinute}`,
    );
  }

  // Validate that the scheduled time is at least 5 minutes in the future
  const now = new Date();
  const scheduledTime = new Date(startDate);
  scheduledTime.setHours(hour, minute, 0, 0);

  const minScheduledTime = new Date(now.getTime() + 5 * 60 * 1000);
  if (scheduledTime < minScheduledTime) {
    return err("Schedule time must be at least 5 minutes in the future");
  }

  return ok(undefined);
}

/**
 * Validate notification content based on type
 */
export function validateNotificationContent(
  notificationType: NotificationScheduleType,
  notificationTitle: string | null | undefined,
  notificationBody: string | null | undefined,
  notificationUrl: string | null | undefined,
): Result<void, string> {
  // INFO type doesn't require title/body (used for system notifications)
  if (notificationType === NotificationScheduleType.INFO) {
    return ok(undefined);
  }

  // All other types require title
  if (!notificationTitle || notificationTitle.trim() === "") {
    return err("notificationTitle is required for this notification type");
  }

  if (notificationTitle.length > VALIDATION_RULES.notificationTitle.maxLength) {
    return err(
      `notificationTitle must be at most ${VALIDATION_RULES.notificationTitle.maxLength} characters`,
    );
  }

  // All other types require body
  if (!notificationBody || notificationBody.trim() === "") {
    return err("notificationBody is required for this notification type");
  }

  if (notificationBody.length > VALIDATION_RULES.notificationBody.maxLength) {
    return err(
      `notificationBody must be at most ${VALIDATION_RULES.notificationBody.maxLength} characters`,
    );
  }

  // URL is optional but must be valid if provided
  if (notificationUrl !== null && notificationUrl !== undefined) {
    if (notificationUrl.length > VALIDATION_RULES.notificationUrl.maxLength) {
      return err(
        `notificationUrl must be at most ${VALIDATION_RULES.notificationUrl.maxLength} characters`,
      );
    }
  }

  return ok(undefined);
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
  }): Result<NotificationSchedule, string> {
    // Validate name
    if (!props.name || props.name.trim() === "") {
      return err("name is required");
    }
    if (props.name.length > VALIDATION_RULES.name.maxLength) {
      return err(
        `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
      );
    }

    // Validate notification content
    const contentValidation = validateNotificationContent(
      props.notificationType,
      props.notificationTitle,
      props.notificationBody,
      props.notificationUrl,
    );
    if (isError(contentValidation)) {
      return err(contentValidation.error);
    }

    // Normalize schedule window
    const normalized = normalizeScheduleWindow({
      startDate: props.startDate,
      endDate: props.endDate,
      hour: props.hour,
      minute: props.minute,
    });

    // Validate date range
    const dateRangeValidation = validateDateRange(
      normalized.startDate,
      normalized.endDate,
    );
    if (isError(dateRangeValidation)) {
      return err(dateRangeValidation.error);
    }

    // Validate future dates
    const futureValidation = validateFutureDates(
      normalized.startDate,
      normalized.endDate,
    );
    if (isError(futureValidation)) {
      return err(futureValidation.error);
    }

    // Validate reasonable date range
    const reasonableValidation = validateReasonableDateRange(
      normalized.startDate,
      normalized.endDate,
    );
    if (isError(reasonableValidation)) {
      return err(reasonableValidation.error);
    }

    // Validate minimum duration
    const durationValidation = validateMinimumDuration(
      normalized.startDate,
      normalized.endDate,
    );
    if (isError(durationValidation)) {
      return err(durationValidation.error);
    }

    // Validate schedule time
    const timeValidation = validateScheduleTime(
      normalized.startDate,
      normalized.hour,
      normalized.minute,
    );
    if (isError(timeValidation)) {
      return err(timeValidation.error);
    }

    // Validate createdById
    if (!props.createdById || props.createdById.trim() === "") {
      return err("createdById is required");
    }

    const now = new Date();

    return ok(
      new NotificationSchedule(
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
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
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
  }): Result<NotificationSchedule, string> {
    // Validate name if provided
    if (props.name !== undefined) {
      if (props.name.trim() === "") {
        return err("name is required");
      }
      if (props.name.length > VALIDATION_RULES.name.maxLength) {
        return err(
          `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
        );
      }
    }

    // Determine which dates/times to use
    const baseStartDate = props.startDate ?? this.startDate;
    const baseEndDate = props.endDate ?? this.endDate;
    const baseHour = props.hour ?? this.hour;
    const baseMinute = props.minute ?? this.minute;

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
      const dateRangeValidation = validateDateRange(
        finalStartDate,
        finalEndDate,
      );
      if (isError(dateRangeValidation)) {
        return err(dateRangeValidation.error);
      }

      const futureValidation = validateFutureDates(
        finalStartDate,
        finalEndDate,
        true,
      );
      if (isError(futureValidation)) {
        return err(futureValidation.error);
      }

      const reasonableValidation = validateReasonableDateRange(
        finalStartDate,
        finalEndDate,
        true,
      );
      if (isError(reasonableValidation)) {
        return err(reasonableValidation.error);
      }

      const durationValidation = validateMinimumDuration(
        finalStartDate,
        finalEndDate,
      );
      if (isError(durationValidation)) {
        return err(durationValidation.error);
      }

      // Only validate schedule time if start date is in the future
      if (finalStartDate > new Date()) {
        const timeValidation = validateScheduleTime(
          finalStartDate,
          finalHour,
          finalMinute,
        );
        if (isError(timeValidation)) {
          return err(timeValidation.error);
        }
      }
    }

    // Validate notification content if changed
    const finalTitle =
      props.notificationTitle !== undefined
        ? props.notificationTitle
        : this.notificationTitle;
    const finalBody =
      props.notificationBody !== undefined
        ? props.notificationBody
        : this.notificationBody;
    const finalUrl =
      props.notificationUrl !== undefined
        ? props.notificationUrl
        : this.notificationUrl;

    if (
      props.notificationTitle !== undefined ||
      props.notificationBody !== undefined ||
      props.notificationUrl !== undefined
    ) {
      const contentValidation = validateNotificationContent(
        this.notificationType,
        finalTitle,
        finalBody,
        finalUrl,
      );
      if (isError(contentValidation)) {
        return err(contentValidation.error);
      }
    }

    return ok(
      new NotificationSchedule(
        this.id,
        props.name ?? this.name,
        this.tripId,
        this.notificationType,
        finalTitle,
        finalBody,
        finalUrl,
        finalStartDate,
        finalEndDate,
        finalHour,
        finalMinute,
        props.isActive ?? this.isActive,
        this.createdById,
        this.lastRun,
        this.createdAt,
        new Date(),
      ),
    );
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
  }): Result<NotificationSchedule, string> {
    const newStartDate = params.startDate ?? new Date();
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
