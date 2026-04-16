import { Effect } from "effect";
import { ValidationError, StateTransitionError } from "../../system/errors";
import {
  NotificationStatus,
  NotificationPriority,
  isTerminalNotificationStatus,
} from "../../notification/enums";
import { validate } from "../../system/utils/entity-validation";
import { createStateMachine } from "../../system/utils/state-machine";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Notification entity - represents a notification in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Notification {
  private constructor(
    public readonly id: string,
    public readonly tripId: string | null,
    public readonly title: string,
    public readonly body: string,
    public readonly url: string | null,
    public readonly status: NotificationStatus,
    public readonly priority: NotificationPriority,
    public readonly scheduledFor: Date | null,
    public readonly sentAt: Date | null,
    public readonly failureReason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdById: string,
  ) {}

  /**
   * State machine for notification status transitions
   */
  private static readonly stateMachine = createStateMachine<NotificationStatus>(
    {
      transitions: {
        [NotificationStatus.DRAFT]: [
          NotificationStatus.READY,
          NotificationStatus.CANCELLED,
        ],
        [NotificationStatus.READY]: [
          NotificationStatus.SENT,
          NotificationStatus.FAILED,
          NotificationStatus.CANCELLED,
        ],
        [NotificationStatus.SENT]: [],
        [NotificationStatus.FAILED]: [NotificationStatus.READY],
        [NotificationStatus.CANCELLED]: [],
      },
      terminalStates: [NotificationStatus.SENT, NotificationStatus.CANCELLED],
    },
  );

  /**
   * Factory method to create a new Notification
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId?: string | null;
    title: string;
    body: string;
    url?: string | null;
    status?: NotificationStatus;
    priority?: NotificationPriority;
    scheduledFor?: Date | null;
    sentAt?: Date | null;
    failureReason?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    createdById: string;
  }): Effect.Effect<Notification, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate title
      const title = yield* validate.string(props.title, "title", {
        required: true,
        minLength: 1,
        maxLength: 255,
      });

      // Validate body
      const body = yield* validate.string(props.body, "body", {
        required: true,
        minLength: 1,
        maxLength: 2000,
      });

      // Validate URL if provided
      let url: string | null = null;
      if (props.url) {
        url = yield* validate.string(props.url, "url", {
          required: false,
          maxLength: 500,
        });
      }

      // Validate status
      const status = props.status ?? NotificationStatus.DRAFT;
      if (!Object.values(NotificationStatus).includes(status)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid status: ${status}`,
            field: "status",
          }),
        );
      }

      // Validate priority
      const priority = props.priority ?? NotificationPriority.NORMAL;
      if (!Object.values(NotificationPriority).includes(priority)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid priority: ${priority}`,
            field: "priority",
          }),
        );
      }

      // Validate scheduledFor if provided (must be in the future for new notifications)
      let scheduledFor: Date | null = null;
      if (props.scheduledFor) {
        scheduledFor = props.scheduledFor;
        // Note: We don't validate future date here - the use case layer handles that
      }

      // Validate failure reason if provided
      let failureReason: string | null = null;
      if (props.failureReason) {
        failureReason = yield* validate.string(
          props.failureReason,
          "failureReason",
          {
            required: false,
            maxLength: 1000,
          },
        );
      }

      // Validate createdById
      const createdById = yield* validate.id(props.createdById, "createdById");

      // Validate tripId if provided
      let tripId: string | null = null;
      if (props.tripId) {
        tripId = yield* validate.id(props.tripId, "tripId");
      }

      const ts = timestamps(props);

      return new Notification(
        props.id ?? crypto.randomUUID(),
        tripId,
        title,
        body,
        url,
        status,
        priority,
        scheduledFor,
        props.sentAt ?? null,
        failureReason,
        ts.createdAt,
        ts.updatedAt,
        createdById,
      );
    });
  }

  /**
   * Transition notification to a new status
   */
  transitionStatus(
    newStatus: NotificationStatus,
  ): Effect.Effect<Notification, StateTransitionError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (!Notification.stateMachine.canTransition(self.status, newStatus)) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to ${newStatus}`,
            from: self.status,
            to: newStatus,
            entityType: "Notification",
          }),
        );
      }

      return updateEntity(self, { status: newStatus }, Notification);
    });
  }

  /**
   * Mark notification as ready to send
   */
  markReady(): Effect.Effect<Notification, StateTransitionError, never> {
    return this.transitionStatus(NotificationStatus.READY);
  }

  /**
   * Mark notification as sent
   */
  markSent(): Effect.Effect<Notification, StateTransitionError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (
        !Notification.stateMachine.canTransition(
          self.status,
          NotificationStatus.SENT,
        )
      ) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to SENT`,
            from: self.status,
            to: NotificationStatus.SENT,
            entityType: "Notification",
          }),
        );
      }

      return updateEntity(
        self,
        {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
        Notification,
      );
    });
  }

  /**
   * Mark notification as failed
   */
  markFailed(
    reason: string,
  ): Effect.Effect<
    Notification,
    StateTransitionError | ValidationError,
    never
  > {
    const self = this;
    return Effect.gen(function* () {
      if (
        !Notification.stateMachine.canTransition(
          self.status,
          NotificationStatus.FAILED,
        )
      ) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to FAILED`,
            from: self.status,
            to: NotificationStatus.FAILED,
            entityType: "Notification",
          }),
        );
      }

      const validatedReason = yield* validate.string(reason, "failureReason", {
        required: true,
        maxLength: 1000,
      });

      return updateEntity(
        self,
        {
          status: NotificationStatus.FAILED,
          failureReason: validatedReason,
        },
        Notification,
      );
    });
  }

  /**
   * Cancel the notification
   */
  cancel(): Effect.Effect<Notification, StateTransitionError, never> {
    return this.transitionStatus(NotificationStatus.CANCELLED);
  }

  /**
   * Schedule the notification for a specific time
   */
  schedule(
    scheduledFor: Date,
  ): Effect.Effect<Notification, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      return updateEntity(
        self,
        {
          scheduledFor,
        },
        Notification,
      );
    });
  }

  /**
   * Update notification content
   */
  update(props: {
    title?: string;
    body?: string;
    url?: string | null;
    priority?: NotificationPriority;
  }): Effect.Effect<Notification, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Can only update draft notifications
      if (self.status !== NotificationStatus.DRAFT) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Can only update notifications in DRAFT status",
            field: "status",
          }),
        );
      }

      // Validate title if provided
      let title = self.title;
      if (props.title !== undefined) {
        title = yield* validate.string(props.title, "title", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate body if provided
      let body = self.body;
      if (props.body !== undefined) {
        body = yield* validate.string(props.body, "body", {
          required: true,
          minLength: 1,
          maxLength: 2000,
        });
      }

      // Validate URL if provided
      let url = self.url;
      if (props.url !== undefined) {
        if (props.url) {
          url = yield* validate.string(props.url, "url", {
            required: false,
            maxLength: 500,
          });
        } else {
          url = null;
        }
      }

      // Validate priority if provided
      let priority = self.priority;
      if (props.priority !== undefined) {
        if (!Object.values(NotificationPriority).includes(props.priority)) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Invalid priority: ${props.priority}`,
              field: "priority",
            }),
          );
        }
        priority = props.priority;
      }

      return updateEntity(
        self,
        {
          title,
          body,
          url,
          priority,
        },
        Notification,
      );
    });
  }

  /**
   * Check if notification is in draft status
   */
  isDraft(): boolean {
    return this.status === NotificationStatus.DRAFT;
  }

  /**
   * Check if notification is ready to send
   */
  isReady(): boolean {
    return this.status === NotificationStatus.READY;
  }

  /**
   * Check if notification has been sent
   */
  isSent(): boolean {
    return this.status === NotificationStatus.SENT;
  }

  /**
   * Check if notification has failed
   */
  isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  /**
   * Check if notification is cancelled
   */
  isCancelled(): boolean {
    return this.status === NotificationStatus.CANCELLED;
  }

  /**
   * Check if notification is in a terminal state
   */
  isTerminal(): boolean {
    return isTerminalNotificationStatus(this.status);
  }

  /**
   * Check if notification is high priority
   */
  isHighPriority(): boolean {
    return (
      this.priority === NotificationPriority.HIGH ||
      this.priority === NotificationPriority.URGENT
    );
  }

  /**
   * Check if notification is urgent
   */
  isUrgent(): boolean {
    return this.priority === NotificationPriority.URGENT;
  }

  /**
   * Check if notification is scheduled
   */
  isScheduled(): boolean {
    return this.scheduledFor !== null;
  }

  /**
   * Check if notification is due to be sent
   */
  isDue(now: Date = new Date()): boolean {
    return (
      this.status === NotificationStatus.READY &&
      this.scheduledFor !== null &&
      this.scheduledFor <= now
    );
  }

  /**
   * Check if notification belongs to a trip
   */
  belongsToTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Check if notification was created by specific user
   */
  wasCreatedBy(userId: string): boolean {
    return this.createdById === userId;
  }
}
