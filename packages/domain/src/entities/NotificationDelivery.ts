import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";

/**
 * Push delivery record interface - tracks push notification to individual user
 * Replaces NotificationPush entity
 */
export interface PushDeliveryRecord {
  readonly targetUserId: string;
  readonly status: "SENT" | "FAILED";
  readonly sentAt: Date | null;
  readonly failureReason: string | null;
}

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
 * State machine for NotificationDelivery status transitions
 */
const stateMachine = createStateMachine<NotificationDeliveryStatus>({
  transitions: {
    [NotificationDeliveryStatus.PENDING]: [
      NotificationDeliveryStatus.IN_PROGRESS,
      NotificationDeliveryStatus.FAILED,
    ],
    [NotificationDeliveryStatus.IN_PROGRESS]: [
      NotificationDeliveryStatus.COMPLETED,
      NotificationDeliveryStatus.FAILED,
    ],
    [NotificationDeliveryStatus.COMPLETED]: [],
    [NotificationDeliveryStatus.FAILED]: [],
  },
  terminalStates: [
    NotificationDeliveryStatus.COMPLETED,
    NotificationDeliveryStatus.FAILED,
  ],
});

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
    // NEW: Nested push delivery records
    public readonly pushes: readonly PushDeliveryRecord[],
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
    // NEW: Pushes parameter
    pushes?: PushDeliveryRecord[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<NotificationDelivery, ValidationError> {
    // Validate notificationId
    const notificationId = validate.id(props.notificationId, "notificationId");
    if (isError(notificationId)) return err(notificationId.error);

    // Validate counts
    const totalRecipients = validate.number(
      props.totalRecipients ?? 0,
      "totalRecipients",
      {
        required: true,
        min: 0,
        integer: true,
      },
    );
    if (isError(totalRecipients)) return err(totalRecipients.error);

    const successCount = validate.number(
      props.successCount ?? 0,
      "successCount",
      {
        required: true,
        min: 0,
        integer: true,
      },
    );
    if (isError(successCount)) return err(successCount.error);

    const failureCount = validate.number(
      props.failureCount ?? 0,
      "failureCount",
      {
        required: true,
        min: 0,
        integer: true,
      },
    );
    if (isError(failureCount)) return err(failureCount.error);

    // Validate counts relationship
    if (successCount.value + failureCount.value > totalRecipients.value) {
      return err(
        new ValidationError(
          "successCount + failureCount cannot exceed totalRecipients",
          "counts",
        ),
      );
    }

    // Validate errors length if provided
    if (props.errors) {
      const validated = validate.string(props.errors, "errors", {
        required: false,
        maxLength: 2000,
      });
      if (isError(validated)) return err(validated.error);
    }

    // Validate completedAt is after startedAt if both present
    const startedAt = props.deliveryStartedAt ?? new Date();
    if (
      props.deliveryCompletedAt &&
      props.deliveryCompletedAt.getTime() < startedAt.getTime()
    ) {
      return err(
        new ValidationError(
          "deliveryCompletedAt must be after deliveryStartedAt",
          "deliveryCompletedAt",
        ),
      );
    }

    const ts = timestamps(props);

    return ok(
      new NotificationDelivery(
        props.id ?? crypto.randomUUID(),
        props.tripId ?? null,
        notificationId.value,
        props.scheduleId ?? null,
        startedAt,
        props.deliveryCompletedAt ?? null,
        totalRecipients.value,
        successCount.value,
        failureCount.value,
        props.errors ?? null,
        props.status ?? NotificationDeliveryStatus.PENDING,
        Object.freeze(props.pushes ?? []),
        ts.createdAt,
        ts.updatedAt,
      ),
    );
  }

  /**
   * Start delivery
   * Returns a new NotificationDelivery instance (immutable)
   */
  start(): NotificationDelivery {
    return updateEntity(
      this,
      {
        deliveryStartedAt: new Date(),
        status: NotificationDeliveryStatus.IN_PROGRESS,
      },
      NotificationDelivery,
    );
  }

  /**
   * Mark delivery as completed
   * Returns a new NotificationDelivery instance (immutable)
   */
  complete(): NotificationDelivery {
    return updateEntity(
      this,
      {
        deliveryCompletedAt: new Date(),
        status: NotificationDeliveryStatus.COMPLETED,
      },
      NotificationDelivery,
    );
  }

  /**
   * Mark delivery as failed
   * Returns a Result with new NotificationDelivery instance or ValidationError
   */
  markAsFailed(errors: string): Result<NotificationDelivery, ValidationError> {
    const validated = validate.string(errors, "errors", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(validated)) return err(validated.error);

    return ok(
      updateEntity(
        this,
        {
          deliveryCompletedAt: new Date(),
          errors: validated.value,
          status: NotificationDeliveryStatus.FAILED,
        },
        NotificationDelivery,
      ),
    );
  }

  /**
   * Update delivery statistics
   * Returns a Result with new NotificationDelivery instance or ValidationError
   */
  updateStats(props: {
    totalRecipients?: number;
    successCount?: number;
    failureCount?: number;
  }): Result<NotificationDelivery, ValidationError> {
    const total = props.totalRecipients ?? this.totalRecipients;
    const success = props.successCount ?? this.successCount;
    const failure = props.failureCount ?? this.failureCount;

    if (total < 0 || success < 0 || failure < 0) {
      return err(new ValidationError("counts must be non-negative", "counts"));
    }

    if (success + failure > total) {
      return err(
        new ValidationError("success + failure cannot exceed total", "counts"),
      );
    }

    const updates: Partial<NotificationDelivery> = {};
    if (props.totalRecipients !== undefined)
      updates.totalRecipients = props.totalRecipients;
    if (props.successCount !== undefined)
      updates.successCount = props.successCount;
    if (props.failureCount !== undefined)
      updates.failureCount = props.failureCount;

    return ok(updateEntity(this, updates, NotificationDelivery));
  }

  /**
   * Record a push delivery attempt
   * Returns a new NotificationDelivery instance (immutable)
   */
  recordPush(
    userId: string,
    success: boolean,
    error?: string,
  ): NotificationDelivery {
    const record: PushDeliveryRecord = {
      targetUserId: userId,
      status: success ? "SENT" : "FAILED",
      sentAt: success ? new Date() : null,
      failureReason: error ?? null,
    };

    return updateEntity(
      this,
      {
        successCount: this.successCount + (success ? 1 : 0),
        failureCount: this.failureCount + (success ? 0 : 1),
        pushes: Object.freeze([...this.pushes, record]),
      },
      NotificationDelivery,
    );
  }

  /**
   * Get all failed push deliveries
   */
  getFailedPushes(): PushDeliveryRecord[] {
    return this.pushes.filter((p) => p.status === "FAILED");
  }

  /**
   * Get all successful push deliveries
   */
  getSuccessfulPushes(): PushDeliveryRecord[] {
    return this.pushes.filter((p) => p.status === "SENT");
  }

  /**
   * Check if delivery is complete (all recipients have been processed)
   */
  isComplete(): boolean {
    return this.pushes.length >= this.totalRecipients;
  }

  /**
   * Check if a specific user has been sent a push
   */
  isPushSentToUser(userId: string): boolean {
    return this.pushes.some(
      (p) => p.targetUserId === userId && p.status === "SENT",
    );
  }

  /**
   * Get push record for a specific user
   */
  getPushForUser(userId: string): PushDeliveryRecord | undefined {
    return this.pushes.find((p) => p.targetUserId === userId);
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
    return stateMachine.isTerminal(this.status);
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
