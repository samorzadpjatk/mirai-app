import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

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
 * Validation rules for notification data
 */
const VALIDATION_RULES = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  body: {
    minLength: 1,
    maxLength: 2000,
  },
};

/**
 * Valid status transitions
 */
const VALID_STATUS_TRANSITIONS: Record<
  NotificationStatus,
  NotificationStatus[]
> = {
  [NotificationStatus.DRAFT]: [
    NotificationStatus.READY,
    NotificationStatus.CANCELLED,
  ],
  [NotificationStatus.READY]: [
    NotificationStatus.SENT,
    NotificationStatus.FAILED,
    NotificationStatus.CANCELLED,
  ],
  [NotificationStatus.SENT]: [], // Terminal state
  [NotificationStatus.FAILED]: [NotificationStatus.READY], // Can retry
  [NotificationStatus.CANCELLED]: [], // Terminal state
};

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
  }): Result<Notification, string> {
    // Validate title
    if (!props.title || props.title.trim() === "") {
      return err("title is required");
    }
    if (props.title.length > VALIDATION_RULES.title.maxLength) {
      return err(
        `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
      );
    }

    // Validate body
    if (!props.body || props.body.trim() === "") {
      return err("body is required");
    }
    if (props.body.length > VALIDATION_RULES.body.maxLength) {
      return err(
        `body must be at most ${VALIDATION_RULES.body.maxLength} characters`,
      );
    }

    // Validate createdById
    if (!props.createdById || props.createdById.trim() === "") {
      return err("createdById is required");
    }

    // Validate scheduledFor is not in the past
    if (props.scheduledFor && props.scheduledFor.getTime() < Date.now()) {
      return err("scheduledFor must be in the future");
    }

    const now = new Date();

    return ok(
      new Notification(
        props.id ?? crypto.randomUUID(),
        props.title.trim(),
        props.body.trim(),
        props.url ?? null,
        props.createdById.trim(),
        props.tripId ?? null,
        props.status ?? NotificationStatus.DRAFT,
        props.priority ?? NotificationPriority.NORMAL,
        props.scheduledFor ?? null,
        props.sentAt ?? null,
        props.failureReason ?? null,
        props.createdAt ?? now,
        props.updatedAt ?? now,
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
  }): Result<Notification, string> {
    // Cannot update after sent
    if (this.isSent()) {
      return err("Cannot update a sent notification");
    }

    // Validate title if provided
    if (props.title !== undefined) {
      if (props.title.trim() === "") {
        return err("title is required");
      }
      if (props.title.length > VALIDATION_RULES.title.maxLength) {
        return err(
          `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
        );
      }
    }

    // Validate body if provided
    if (props.body !== undefined) {
      if (props.body.trim() === "") {
        return err("body is required");
      }
      if (props.body.length > VALIDATION_RULES.body.maxLength) {
        return err(
          `body must be at most ${VALIDATION_RULES.body.maxLength} characters`,
        );
      }
    }

    return ok(
      new Notification(
        this.id,
        props.title ?? this.title,
        props.body ?? this.body,
        props.url !== undefined ? props.url : this.url,
        this.createdById,
        this.tripId,
        this.status,
        this.priority,
        this.scheduledFor,
        this.sentAt,
        this.failureReason,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update notification status
   * Returns a new Notification instance (immutable)
   * @throws if status transition is invalid
   */
  updateStatus(newStatus: NotificationStatus): Notification {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      newStatus,
      this.priority,
      this.scheduledFor,
      this.sentAt,
      this.failureReason,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Mark notification as sent
   * Returns a new Notification instance (immutable)
   */
  markAsSent(): Notification {
    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      NotificationStatus.SENT,
      this.priority,
      this.scheduledFor,
      new Date(), // sentAt
      null, // clear failure reason
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Mark notification as failed
   * Returns a new Notification instance (immutable)
   */
  markAsFailed(reason: string): Notification {
    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      NotificationStatus.FAILED,
      this.priority,
      this.scheduledFor,
      this.sentAt,
      reason, // failureReason
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Cancel notification
   * Returns a new Notification instance (immutable)
   * Cannot cancel after sent
   */
  cancel(): Notification {
    if (this.isSent()) {
      throw new Error("Cannot cancel a sent notification");
    }

    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      NotificationStatus.CANCELLED,
      this.priority,
      null, // clear scheduledFor
      this.sentAt,
      this.failureReason,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Update priority
   * Returns a new Notification instance (immutable)
   */
  updatePriority(newPriority: NotificationPriority): Notification {
    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      this.status,
      newPriority,
      this.scheduledFor,
      this.sentAt,
      this.failureReason,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Schedule notification for future delivery
   * Returns a new Notification instance (immutable)
   */
  schedule(scheduledFor: Date): Result<Notification, string> {
    if (scheduledFor.getTime() < Date.now()) {
      return err("scheduledFor must be in the future");
    }

    return ok(
      new Notification(
        this.id,
        this.title,
        this.body,
        this.url,
        this.createdById,
        this.tripId,
        this.status,
        this.priority,
        scheduledFor,
        this.sentAt,
        this.failureReason,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Remove schedule
   * Returns a new Notification instance (immutable)
   */
  unschedule(): Notification {
    return new Notification(
      this.id,
      this.title,
      this.body,
      this.url,
      this.createdById,
      this.tripId,
      this.status,
      this.priority,
      null, // clear scheduledFor
      this.sentAt,
      this.failureReason,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: NotificationStatus): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[this.status];
    return validTransitions.includes(newStatus);
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
    return this.isSent() || this.isCancelled();
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
