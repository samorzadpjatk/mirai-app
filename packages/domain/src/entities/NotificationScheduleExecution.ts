import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * NotificationScheduleExecution entity - tracks when scheduled notifications were sent
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class NotificationScheduleExecution {
  private constructor(
    public readonly notificationId: string,
    public readonly scheduleId: string,
    public readonly executedAt: Date,
  ) {}

  /**
   * Factory method to create a new NotificationScheduleExecution
   * Validates all input data
   */
  static create(props: {
    notificationId: string;
    scheduleId: string;
    executedAt?: Date;
  }): Result<NotificationScheduleExecution, string> {
    // Validate notificationId
    if (!props.notificationId || props.notificationId.trim() === "") {
      return err("notificationId is required");
    }

    // Validate scheduleId
    if (!props.scheduleId || props.scheduleId.trim() === "") {
      return err("scheduleId is required");
    }

    return ok(
      new NotificationScheduleExecution(
        props.notificationId.trim(),
        props.scheduleId.trim(),
        props.executedAt ?? new Date(),
      ),
    );
  }

  /**
   * Get composite identifier
   */
  getCompositeId(): string {
    return `${this.notificationId}:${this.scheduleId}:${this.executedAt.getTime()}`;
  }

  /**
   * Check if this execution matches given notification and schedule
   */
  matches(notificationId: string, scheduleId: string): boolean {
    return (
      this.notificationId === notificationId && this.scheduleId === scheduleId
    );
  }

  /**
   * Check if for specific notification
   */
  isForNotification(notificationId: string): boolean {
    return this.notificationId === notificationId;
  }

  /**
   * Check if for specific schedule
   */
  isForSchedule(scheduleId: string): boolean {
    return this.scheduleId === scheduleId;
  }

  /**
   * Get age of execution in milliseconds
   */
  getAgeMs(): number {
    return Date.now() - this.executedAt.getTime();
  }

  /**
   * Check if execution is older than given milliseconds
   */
  isOlderThan(ms: number): boolean {
    return this.getAgeMs() > ms;
  }
}
