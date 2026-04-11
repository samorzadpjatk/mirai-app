import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

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
    public readonly title: string,
    public readonly body: string,
    public readonly url: string | null,
    public readonly createdById: string,
    public readonly tripId: string | null,
    public readonly status: NotificationStatus,
    public readonly priority: NotificationPriority,
    public readonly scheduledFor: Date | null,
    public readonly sentAt: Date | null,
    public readonly failureReason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Notification
   * Validates all input data
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
  }): Result<Notification, ValidationError> {
    // Validate title
    const title = validate.string(props.title, "title", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(title)) return err(title.error);

    // Validate body
    const body = validate.string(props.body, "body", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(body)) return err(body.error);

    // Validate createdById
    const createdById = validate.id(props.createdById, "createdById");
    if (isError(createdById)) return err(createdById.error);

    // Validate scheduledFor is not in the past
    if (props.scheduledFor && props.scheduledFor.getTime() < Date.now()) {
      return err(
        new ValidationError(
          "scheduledFor must be in the future",
          "scheduledFor",
        ),
      );
    }

    const ts = timestamps(props);

    return ok(
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
   */
  updateContent(props: {
    title?: string;
    body?: string;
    url?: string | null;
  }): Result<Notification, ValidationError | StateTransitionError> {
    // Cannot update after sent
    if (this.isSent()) {
      return err(new StateTransitionError(this.status, this.status)); // Stay in same state, but operation not allowed
    }

    const updates: Partial<Notification> = {};

    // Validate title if provided
    if (props.title !== undefined) {
      const validated = validate.string(props.title, "title", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.title = validated.value;
    }

    // Validate body if provided
    if (props.body !== undefined) {
      const validated = validate.string(props.body, "body", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.body = validated.value;
    }

    if (props.url !== undefined) {
      updates.url = props.url;
    }

    return ok(updateEntity(this, updates, Notification));
  }

  /**
   * Update notification status
   * Returns a Result with new Notification instance or StateTransitionError
   */
  updateStatus(
    newStatus: NotificationStatus,
  ): Result<Notification, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return err(new StateTransitionError(this.status, newStatus));
    }

    return ok(updateEntity(this, { status: newStatus }, Notification));
  }

  /**
   * Mark notification as sent
   * Returns a Result with new Notification instance or StateTransitionError
   */
  markAsSent(): Result<Notification, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, NotificationStatus.SENT)) {
      return err(
        new StateTransitionError(this.status, NotificationStatus.SENT),
      );
    }

    return ok(
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
   * Returns a Result with new Notification instance or StateTransitionError
   */
  markAsFailed(reason: string): Result<Notification, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, NotificationStatus.FAILED)) {
      return err(
        new StateTransitionError(this.status, NotificationStatus.FAILED),
      );
    }

    return ok(
      updateEntity(
        this,
        { status: NotificationStatus.FAILED, failureReason: reason },
        Notification,
      ),
    );
  }

  /**
   * Cancel notification
   * Returns a Result with new Notification instance or StateTransitionError
   */
  cancel(): Result<Notification, StateTransitionError> {
    if (this.isSent()) {
      return err(
        new StateTransitionError(this.status, NotificationStatus.CANCELLED),
      );
    }

    if (
      !stateMachine.canTransition(this.status, NotificationStatus.CANCELLED)
    ) {
      return err(
        new StateTransitionError(this.status, NotificationStatus.CANCELLED),
      );
    }

    return ok(
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
   * Returns a Result with new Notification instance or ValidationError
   */
  schedule(scheduledFor: Date): Result<Notification, ValidationError> {
    if (scheduledFor.getTime() < Date.now()) {
      return err(
        new ValidationError(
          "scheduledFor must be in the future",
          "scheduledFor",
        ),
      );
    }

    return ok(updateEntity(this, { scheduledFor }, Notification));
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
