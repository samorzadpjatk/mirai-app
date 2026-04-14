import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";

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
    public totalRecipients: number,
    public successCount: number,
    public failureCount: number,
    public readonly errors: string | null,
    public status: NotificationDeliveryStatus,
    public pushes: readonly PushDeliveryRecord[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new NotificationDelivery
   * Validates all input data
   *
   * Returns Effect<NotificationDelivery, ValidationError, never>
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
    pushes?: PushDeliveryRecord[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<NotificationDelivery, ValidationError, never> {
    return Effect.gen(function* () {
      const notificationId = yield* validate.id(
        props.notificationId,
        "notificationId",
      );

      const totalRecipients = yield* validate.number(
        props.totalRecipients ?? 0,
        "totalRecipients",
        { required: true, min: 0, integer: true },
      );

      const successCount = yield* validate.number(
        props.successCount ?? 0,
        "successCount",
        { required: true, min: 0, integer: true },
      );

      const failureCount = yield* validate.number(
        props.failureCount ?? 0,
        "failureCount",
        { required: true, min: 0, integer: true },
      );

      if (successCount + failureCount > totalRecipients) {
        return yield* Effect.fail(
          new ValidationError({
            message:
              "successCount + failureCount cannot exceed totalRecipients",
            field: "counts",
          }),
        );
      }

      let validatedErrors: string | null = null;
      if (props.errors) {
        validatedErrors = yield* validate.string(props.errors, "errors", {
          required: false,
          maxLength: 2000,
        });
      }

      const startedAt = props.deliveryStartedAt ?? new Date();
      if (
        props.deliveryCompletedAt &&
        props.deliveryCompletedAt.getTime() < startedAt.getTime()
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: "deliveryCompletedAt must be after deliveryStartedAt",
            field: "deliveryCompletedAt",
          }),
        );
      }

      const ts = timestamps(props);

      return new NotificationDelivery(
        props.id ?? crypto.randomUUID(),
        props.tripId ?? null,
        notificationId,
        props.scheduleId ?? null,
        startedAt,
        props.deliveryCompletedAt ?? null,
        totalRecipients,
        successCount,
        failureCount,
        validatedErrors,
        props.status ?? NotificationDeliveryStatus.PENDING,
        Object.freeze(props.pushes ?? []),
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Start delivery
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
   */
  markAsFailed(
    errors: string,
  ): Effect.Effect<NotificationDelivery, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const validated = yield* validate.string(errors, "errors", {
        required: true,
        maxLength: 2000,
        trim: true,
      });

      return updateEntity(
        self,
        {
          deliveryCompletedAt: new Date(),
          errors: validated,
          status: NotificationDeliveryStatus.FAILED,
        },
        NotificationDelivery,
      );
    });
  }

  /**
   * Update delivery statistics
   */
  updateStats(props: {
    totalRecipients?: number;
    successCount?: number;
    failureCount?: number;
  }): Effect.Effect<NotificationDelivery, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const total = props.totalRecipients ?? self.totalRecipients;
      const success = props.successCount ?? self.successCount;
      const failure = props.failureCount ?? self.failureCount;

      if (total < 0 || success < 0 || failure < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "counts must be non-negative",
            field: "counts",
          }),
        );
      }

      if (success + failure > total) {
        return yield* Effect.fail(
          new ValidationError({
            message: "success + failure cannot exceed total",
            field: "counts",
          }),
        );
      }

      const updates: Partial<NotificationDelivery> = {};
      if (props.totalRecipients !== undefined)
        updates.totalRecipients = props.totalRecipients;
      if (props.successCount !== undefined)
        updates.successCount = props.successCount;
      if (props.failureCount !== undefined)
        updates.failureCount = props.failureCount;

      return updateEntity(self, updates, NotificationDelivery);
    });
  }

  /**
   * Record a push delivery attempt
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

  getFailedPushes(): PushDeliveryRecord[] {
    return this.pushes.filter((p) => p.status === "FAILED");
  }

  getSuccessfulPushes(): PushDeliveryRecord[] {
    return this.pushes.filter((p) => p.status === "SENT");
  }

  isComplete(): boolean {
    return this.pushes.length >= this.totalRecipients;
  }

  isPushSentToUser(userId: string): boolean {
    return this.pushes.some(
      (p) => p.targetUserId === userId && p.status === "SENT",
    );
  }

  getPushForUser(userId: string): PushDeliveryRecord | undefined {
    return this.pushes.find((p) => p.targetUserId === userId);
  }

  isPending(): boolean {
    return this.status === NotificationDeliveryStatus.PENDING;
  }

  isInProgress(): boolean {
    return this.status === NotificationDeliveryStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === NotificationDeliveryStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === NotificationDeliveryStatus.FAILED;
  }

  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  getSuccessRate(): number {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.successCount / this.totalRecipients) * 100);
  }

  getFailureRate(): number {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.failureCount / this.totalRecipients) * 100);
  }

  isScheduled(): boolean {
    return this.scheduleId !== null;
  }

  isForTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  isForNotification(notificationId: string): boolean {
    return this.notificationId === notificationId;
  }

  getDurationMs(): number | null {
    if (!this.deliveryCompletedAt) return null;
    return (
      this.deliveryCompletedAt.getTime() - this.deliveryStartedAt.getTime()
    );
  }
}
