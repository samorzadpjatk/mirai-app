import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * NotificationDeliveryStatus - represents the status of a bulk notification delivery
 */
export enum NotificationDeliveryStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Validation rules for NotificationDelivery data
 */
const VALIDATION_RULES = {
  errors: {
    maxLength: 2000,
  },
};

/**
 * NotificationDelivery entity - tracks bulk notification delivery operations
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class NotificationDelivery {
  private constructor(
    public readonly id: string,
    public readonly tripId: string | null,
    public readonly notificationId: string,
    public readonly scheduleId: string | null,
    public readonly deliveryStartedAt: Date,
    public readonly deliveryCompletedAt: Date | null,
    public readonly totalRecipients: number,
    public readonly successCount: number,
    public readonly failureCount: number,
    public readonly errors: string | null,
    public readonly status: NotificationDeliveryStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new NotificationDelivery
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId?: string | null;
    notificationId: string;
    scheduleId?: string | null;
    deliveryStartedAt?: Date;
    deliveryCompletedAt?: Date | null;
    totalRecipients?: number;
    successCount?: number;
    failureCount?: number;
    errors?: string | null;
    status?: NotificationDeliveryStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<NotificationDelivery, string> {
    // Validate notificationId
    if (!props.notificationId || props.notificationId.trim() === "") {
      return err("notificationId is required");
    }

    const totalRecipients = props.totalRecipients ?? 0;
    const successCount = props.successCount ?? 0;
    const failureCount = props.failureCount ?? 0;

    // Validate counts are non-negative
    if (totalRecipients < 0) {
      return err("totalRecipients must be non-negative");
    }
    if (successCount < 0) {
      return err("successCount must be non-negative");
    }
    if (failureCount < 0) {
      return err("failureCount must be non-negative");
    }

    // Validate counts relationship
    if (successCount + failureCount > totalRecipients) {
      return err("successCount + failureCount cannot exceed totalRecipients");
    }

    // Validate errors length if provided
    if (
      props.errors &&
      props.errors.length > VALIDATION_RULES.errors.maxLength
    ) {
      return err(
        `errors must be at most ${VALIDATION_RULES.errors.maxLength} characters`,
      );
    }

    // Validate completedAt is after startedAt if both present
    const startedAt = props.deliveryStartedAt ?? new Date();
    if (
      props.deliveryCompletedAt &&
      props.deliveryCompletedAt.getTime() < startedAt.getTime()
    ) {
      return err("deliveryCompletedAt must be after deliveryStartedAt");
    }

    const now = new Date();
    const status = props.status ?? NotificationDeliveryStatus.PENDING;

    return ok(
      new NotificationDelivery(
        props.id ?? crypto.randomUUID(),
        props.tripId ?? null,
        props.notificationId.trim(),
        props.scheduleId ?? null,
        startedAt,
        props.deliveryCompletedAt ?? null,
        totalRecipients,
        successCount,
        failureCount,
        props.errors ?? null,
        status,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Start delivery
   * Returns a new NotificationDelivery instance (immutable)
   */
  start(): NotificationDelivery {
    return new NotificationDelivery(
      this.id,
      this.tripId,
      this.notificationId,
      this.scheduleId,
      new Date(),
      null,
      this.totalRecipients,
      this.successCount,
      this.failureCount,
      this.errors,
      NotificationDeliveryStatus.IN_PROGRESS,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Mark delivery as completed
   * Returns a new NotificationDelivery instance (immutable)
   */
  complete(): NotificationDelivery {
    return new NotificationDelivery(
      this.id,
      this.tripId,
      this.notificationId,
      this.scheduleId,
      this.deliveryStartedAt,
      new Date(),
      this.totalRecipients,
      this.successCount,
      this.failureCount,
      this.errors,
      NotificationDeliveryStatus.COMPLETED,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Mark delivery as failed
   * Returns a new NotificationDelivery instance (immutable)
   */
  markAsFailed(errors: string): Result<NotificationDelivery, string> {
    if (!errors || errors.trim() === "") {
      return err("errors description is required");
    }

    if (errors.length > VALIDATION_RULES.errors.maxLength) {
      return err(
        `errors must be at most ${VALIDATION_RULES.errors.maxLength} characters`,
      );
    }

    return ok(
      new NotificationDelivery(
        this.id,
        this.tripId,
        this.notificationId,
        this.scheduleId,
        this.deliveryStartedAt,
        new Date(),
        this.totalRecipients,
        this.successCount,
        this.failureCount,
        errors.trim(),
        NotificationDeliveryStatus.FAILED,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Update delivery statistics
   * Returns a new NotificationDelivery instance (immutable)
   */
  updateStats(props: {
    totalRecipients?: number;
    successCount?: number;
    failureCount?: number;
  }): Result<NotificationDelivery, string> {
    const total = props.totalRecipients ?? this.totalRecipients;
    const success = props.successCount ?? this.successCount;
    const failure = props.failureCount ?? this.failureCount;

    if (total < 0 || success < 0 || failure < 0) {
      return err("counts must be non-negative");
    }

    if (success + failure > total) {
      return err("success + failure cannot exceed total");
    }

    return ok(
      new NotificationDelivery(
        this.id,
        this.tripId,
        this.notificationId,
        this.scheduleId,
        this.deliveryStartedAt,
        this.deliveryCompletedAt,
        total,
        success,
        failure,
        this.errors,
        this.status,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Check if delivery is pending
   */
  isPending(): boolean {
    return this.status === NotificationDeliveryStatus.PENDING;
  }

  /**
   * Check if delivery is in progress
   */
  isInProgress(): boolean {
    return this.status === NotificationDeliveryStatus.IN_PROGRESS;
  }

  /**
   * Check if delivery is completed
   */
  isCompleted(): boolean {
    return this.status === NotificationDeliveryStatus.COMPLETED;
  }

  /**
   * Check if delivery failed
   */
  isFailed(): boolean {
    return this.status === NotificationDeliveryStatus.FAILED;
  }

  /**
   * Check if delivery is in a terminal state
   */
  isTerminal(): boolean {
    return this.isCompleted() || this.isFailed();
  }

  /**
   * Get success rate as percentage
   */
  getSuccessRate(): number {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.successCount / this.totalRecipients) * 100);
  }

  /**
   * Get failure rate as percentage
   */
  getFailureRate(): number {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.failureCount / this.totalRecipients) * 100);
  }

  /**
   * Check if delivery is scheduled (has scheduleId)
   */
  isScheduled(): boolean {
    return this.scheduleId !== null;
  }

  /**
   * Check if delivery is for a specific trip
   */
  isForTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Check if delivery is for a specific notification
   */
  isForNotification(notificationId: string): boolean {
    return this.notificationId === notificationId;
  }

  /**
   * Get duration of delivery in milliseconds
   */
  getDurationMs(): number | null {
    if (!this.deliveryCompletedAt) return null;
    return (
      this.deliveryCompletedAt.getTime() - this.deliveryStartedAt.getTime()
    );
  }
}
