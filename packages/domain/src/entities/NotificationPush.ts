import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * NotificationPushStatus - represents the delivery status of a push notification
 */
export enum NotificationPushStatus {
  SENT = "sent",
  FAILED = "failed",
}

/**
 * NotificationPush entity - tracks push notification delivery to individual users
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class NotificationPush {
  private constructor(
    public readonly targetUserId: string,
    public readonly notificationId: string,
    public readonly status: NotificationPushStatus,
    public readonly sentAt: Date | null,
    public readonly failureReason: string | null,
  ) {}

  /**
   * Factory method to create a new NotificationPush
   * Validates all input data
   */
  static create(props: {
    targetUserId: string;
    notificationId: string;
    status?: NotificationPushStatus;
    sentAt?: Date | null;
    failureReason?: string | null;
  }): Result<NotificationPush, string> {
    // Validate targetUserId
    if (!props.targetUserId || props.targetUserId.trim() === "") {
      return err("targetUserId is required");
    }

    // Validate notificationId
    if (!props.notificationId || props.notificationId.trim() === "") {
      return err("notificationId is required");
    }

    const status = props.status ?? NotificationPushStatus.SENT;
    const sentAt =
      props.sentAt ??
      (status === NotificationPushStatus.SENT ? new Date() : null);

    // Validate status-specific fields
    if (status === NotificationPushStatus.SENT && !sentAt) {
      return err("sentAt is required when status is 'sent'");
    }

    if (status === NotificationPushStatus.FAILED && !props.failureReason) {
      return err("failureReason is required when status is 'failed'");
    }

    return ok(
      new NotificationPush(
        props.targetUserId.trim(),
        props.notificationId.trim(),
        status,
        sentAt,
        props.failureReason ?? null,
      ),
    );
  }

  /**
   * Mark as sent
   * Returns a new NotificationPush instance (immutable)
   */
  markAsSent(sentAt: Date = new Date()): NotificationPush {
    return new NotificationPush(
      this.targetUserId,
      this.notificationId,
      NotificationPushStatus.SENT,
      sentAt,
      null,
    );
  }

  /**
   * Mark as failed
   * Returns a new NotificationPush instance (immutable)
   */
  markAsFailed(reason: string): Result<NotificationPush, string> {
    if (!reason || reason.trim() === "") {
      return err("failureReason is required");
    }

    return ok(
      new NotificationPush(
        this.targetUserId,
        this.notificationId,
        NotificationPushStatus.FAILED,
        null,
        reason.trim(),
      ),
    );
  }

  /**
   * Check if push was sent successfully
   */
  isSent(): boolean {
    return this.status === NotificationPushStatus.SENT;
  }

  /**
   * Check if push failed
   */
  isFailed(): boolean {
    return this.status === NotificationPushStatus.FAILED;
  }

  /**
   * Get composite identifier
   */
  getCompositeId(): string {
    return `${this.targetUserId}:${this.notificationId}`;
  }

  /**
   * Check if this push is for a specific user
   */
  isForUser(userId: string): boolean {
    return this.targetUserId === userId;
  }

  /**
   * Check if this push is for a specific notification
   */
  isForNotification(notificationId: string): boolean {
    return this.notificationId === notificationId;
  }

  /**
   * Check if this push matches given user and notification
   */
  matches(userId: string, notificationId: string): boolean {
    return (
      this.targetUserId === userId && this.notificationId === notificationId
    );
  }
}
