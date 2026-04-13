import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

/**
 * Notification status workflow
 * DRAFT -> READY -> SENT
 *              -> FAILED
 *              -> CANCELLED
 */
export enum NotificationStatus {
  DRAFT = "DRAFT",
  READY = "READY",
  SENT = "SENT",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * State machine for Notification status transitions
 */
const stateMachine = createStateMachine<NotificationStatus>({
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
});

/**
 * Notification entity - represents a push notification
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Notification {
  private constructor(
    public readonly id: string,
    public title: string,
    public body: string,
    public url: string | null,
    public readonly createdById: string,
    public readonly tripId: string | null,
    public status: NotificationStatus,
    public priority: NotificationPriority,
    public scheduledFor: Date | null,
    public sentAt: Date | null,
    public failureReason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Notification
   * Validates all input data
   *
   * Returns Effect<Notification, ValidationError, never>
   */
  static create(props: {
    id?: string;
    title: string;
    body: string;
    url?: string | null;
    createdById: string;
    tripId?: string | null;
    status?: NotificationStatus;
    priority?: NotificationPriority;
    scheduledFor?: Date | null;
    sentAt?: Date | null;
    failureReason?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<Notification, ValidationError, never> {
    // Validate title
    const title = validate.string(props.title, "title", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(title)) {
      return Effect.fail(
        new ValidationError({
          message: title.error.message,
          field: "title",
        }),
      );
    }

    // Validate body
    const body = validate.string(props.body, "body", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(body)) {
      return Effect.fail(
        new ValidationError({
          message: body.error.message,
          field: "body",
        }),
      );
    }

    // Validate createdById
    const createdById = validate.id(props.createdById, "createdById");
    if (isError(createdById)) {
      return Effect.fail(
        new ValidationError({
          message: createdById.error.message,
          field: "createdById",
        }),
      );
    }

    // Validate scheduledFor is not in the past
    if (props.scheduledFor && props.scheduledFor.getTime() < Date.now()) {
      return Effect.fail(
        new ValidationError({
          message: "scheduledFor must be in the future",
          field: "scheduledFor",
        }),
      );
    }

    const ts = timestamps(props);

    return Effect.succeed(
      new Notification(
        props.id ?? crypto.randomUUID(),
        title.value,
        body.value,
        props.url ?? null,
        createdById.value,
        props.tripId ?? null,
        props.status ?? NotificationStatus.DRAFT,
        props.priority ?? NotificationPriority.NORMAL,
        props.scheduledFor ?? null,
        props.sentAt ?? null,
        props.failureReason ?? null,
        ts.createdAt,
        ts.updatedAt,
      ),
    );
  }

  /**
   * Update notification content (title, body, url)
   * Returns a new Notification instance (immutable)
   * Cannot update after sent
   *
   * Returns Effect<Notification, ValidationError | StateTransitionError, never>
   */
  updateContent(props: {
    title?: string;
    body?: string;
    url?: string | null;
  }): Effect.Effect<
    Notification,
    ValidationError | StateTransitionError,
    never
  > {
    // Cannot update after sent
    if (this.isSent()) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: this.status,
          entityType: "Notification",
        }),
      );
    }

    const updates: Partial<Notification> = {};

    // Validate title if provided
    if (props.title !== undefined) {
      const validated = validate.string(props.title, "title", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "title",
          }),
        );
      }
      updates.title = validated.value;
    }

    // Validate body if provided
    if (props.body !== undefined) {
      const validated = validate.string(props.body, "body", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "body",
          }),
        );
      }
      updates.body = validated.value;
    }

    if (props.url !== undefined) {
      updates.url = props.url;
    }

    return Effect.succeed(updateEntity(this, updates, Notification));
  }

  /**
   * Update notification status
   * Returns an Effect with new Notification instance or StateTransitionError
   */
  updateStatus(
    newStatus: NotificationStatus,
  ): Effect.Effect<Notification, StateTransitionError, never> {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: newStatus,
          entityType: "Notification",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { status: newStatus }, Notification),
    );
  }

  /**
   * Mark notification as sent
   * Returns an Effect with new Notification instance or StateTransitionError
   */
  markAsSent(): Effect.Effect<Notification, StateTransitionError, never> {
    if (!stateMachine.canTransition(this.status, NotificationStatus.SENT)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: NotificationStatus.SENT,
          entityType: "Notification",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          failureReason: null,
        },
        Notification,
      ),
    );
  }

  /**
   * Mark notification as failed
   * Returns an Effect with new Notification instance or StateTransitionError
   */
  markAsFailed(
    reason: string,
  ): Effect.Effect<Notification, StateTransitionError, never> {
    if (!stateMachine.canTransition(this.status, NotificationStatus.FAILED)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: NotificationStatus.FAILED,
          entityType: "Notification",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        { status: NotificationStatus.FAILED, failureReason: reason },
        Notification,
      ),
    );
  }

  /**
   * Cancel notification
   * Returns an Effect with new Notification instance or StateTransitionError
   */
  cancel(): Effect.Effect<Notification, StateTransitionError, never> {
    if (this.isSent()) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: NotificationStatus.CANCELLED,
          entityType: "Notification",
        }),
      );
    }

    if (
      !stateMachine.canTransition(this.status, NotificationStatus.CANCELLED)
    ) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: NotificationStatus.CANCELLED,
          entityType: "Notification",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        { status: NotificationStatus.CANCELLED, scheduledFor: null },
        Notification,
      ),
    );
  }

  /**
   * Update priority
   * Returns a new Notification instance (immutable)
   */
  updatePriority(newPriority: NotificationPriority): Notification {
    return updateEntity(this, { priority: newPriority }, Notification);
  }

  /**
   * Schedule notification for future delivery
   * Returns an Effect with new Notification instance or ValidationError
   */
  schedule(
    scheduledFor: Date,
  ): Effect.Effect<Notification, ValidationError, never> {
    if (scheduledFor.getTime() < Date.now()) {
      return Effect.fail(
        new ValidationError({
          message: "scheduledFor must be in the future",
          field: "scheduledFor",
        }),
      );
    }

    return Effect.succeed(updateEntity(this, { scheduledFor }, Notification));
  }

  /**
   * Remove schedule
   * Returns a new Notification instance (immutable)
   */
  unschedule(): Notification {
    return updateEntity(this, { scheduledFor: null }, Notification);
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: NotificationStatus): boolean {
    return stateMachine.canTransition(this.status, newStatus);
  }

  /**
   * Check if notification is in DRAFT status
   */
  isDraft(): boolean {
    return this.status === NotificationStatus.DRAFT;
  }

  /**
   * Check if notification is in READY status
   */
  isReady(): boolean {
    return this.status === NotificationStatus.READY;
  }

  /**
   * Check if notification has been sent
   */
  isSent(): boolean {
    return this.status === NotificationStatus.SENT && this.sentAt !== null;
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
   * Check if notification is in a terminal state (SENT or CANCELLED)
   */
  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  /**
   * Check if notification is scheduled for future delivery
   */
  isScheduled(): boolean {
    return this.scheduledFor !== null;
  }

  /**
   * Check if notification is overdue (scheduled time has passed)
   */
  isOverdue(): boolean {
    if (!this.scheduledFor || this.status !== NotificationStatus.READY) {
      return false;
    }
    return this.scheduledFor.getTime() < Date.now();
  }

  /**
   * Check if notification is ready to be sent
   */
  isReadyToSend(): boolean {
    if (this.status !== NotificationStatus.READY) {
      return false;
    }

    // If scheduled, check if it's time
    if (this.scheduledFor) {
      return this.scheduledFor.getTime() <= Date.now();
    }

    return true;
  }

  /**
   * Check if notification has a URL
   */
  hasUrl(): boolean {
    return this.url !== null && this.url !== "";
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
   * Get the URL to open when notification is clicked
   * Returns null if no URL set
   */
  getUrl(): string | null {
    return this.url;
  }

  /**
   * Get summary for display
   */
  getSummary(): string {
    return `${this.title}: ${this.body.substring(0, 100)}${this.body.length > 100 ? "..." : ""}`;
  }
}
