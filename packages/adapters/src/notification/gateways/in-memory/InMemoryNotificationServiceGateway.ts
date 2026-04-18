import { Effect, Data } from "effect";
import type {
  INotificationServicePort,
  NotificationId,
  SendNotificationResult,
  MobileNotificationResult,
  NotificationContent,
} from "@mirai-app/domain";
import type { IPortError } from "@mirai-app/domain";
import type { INotificationPort, IPushSubscriptionPort } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * Error for notification service failures
 */
export class NotificationServiceError
  extends Data.TaggedError("NotificationServiceError")<{
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Notification service operation failed";
}

/**
 * In-Memory Notification Service Gateway
 *
 * Implements INotificationServicePort using in-memory storage for testing.
 * Simulates push notification delivery without external API calls.
 *
 * This gateway uses the AuthContext pattern for authorization matching the
 * ExpoNotificationServiceGateway implementation.
 */
export class InMemoryNotificationServiceGateway implements INotificationServicePort {
  private sentNotifications: Array<{
    userIds: string[];
    title: string;
    body: string;
    url: string;
    tripId: string;
    createdById: string;
    timestamp: Date;
  }> = [];

  private mobileNotifications: Array<{
    notificationId: NotificationId;
    sent: number;
    failed: number;
    total: number;
    timestamp: Date;
  }> = [];

  constructor(
    private notificationPort: INotificationPort,
    private pushSubscriptionPort: IPushSubscriptionPort,
  ) {}

  /**
   * Send notification to multiple users
   *
   * Requires trip write access for the specified tripId.
   */
  sendNotification(params: {
    userIds: string[];
    title: string;
    body: string;
    url: string;
    tripId: string;
    createdById: string;
  }) {
    const { userIds, title, body, url, tripId, createdById } = params;
    const pushSubscriptionPort = this.pushSubscriptionPort;
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify trip write access
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "write",
        });
      }

      // Fetch push subscriptions for target users
      const tokens: string[] = [];

      for (const userId of userIds) {
        const subs = yield* pushSubscriptionPort.findByUserId(userId);
        for (const sub of subs) {
          tokens.push(sub.token);
        }
      }

      // Record the notification attempt
      const notificationRecord = {
        userIds,
        title,
        body,
        url,
        tripId,
        createdById,
        timestamp: new Date(),
      };

      self.sentNotifications.push(notificationRecord);

      // In test mode, we simulate success for all tokens
      const recipientCount = tokens.length;

      return {
        success: true,
        notificationId: userIds[0] as NotificationId,
        recipientCount,
      };
    });
  }

  /**
   * Send mobile push notifications for a notification
   *
   * Requires admin or trip write access for the notification's trip.
   */
  sendMobileNotifications(notificationId: NotificationId) {
    const notificationPort = this.notificationPort;
    const pushSubscriptionPort = this.pushSubscriptionPort;
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch the notification with pushes first to get tripId
      const notificationResult = yield* notificationPort.findWithPushes(
        notificationId,
      );

      if (!notificationResult) {
        return {
          success: false,
          sent: 0,
          failed: 0,
          total: 0,
        };
      }

      const { notification, pushes } = notificationResult;

      // Verify trip write access if authenticated and trip context exists
      if (authCtx.isAuthenticated && notification.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: notification.tripId,
          requiredPermission: "write",
        });
      }

      // Filter pending pushes
      const pendingPushes = pushes.filter((p) => p.status === "pending");
      const hasExplicitAudience = pushes.length > 0;

      if (hasExplicitAudience && pendingPushes.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          total: pushes.length,
        };
      }

      // Get target user IDs
      const targetUserIds = hasExplicitAudience
        ? pendingPushes.map((p) => p.targetUserId)
        : [];

      // Fetch push subscriptions
      const scopedSubs: { userId: string; token: string }[] = [];

      if (hasExplicitAudience) {
        const pendingUserIds = new Set(targetUserIds);
        for (const userId of pendingUserIds) {
          const subs = yield* pushSubscriptionPort.findByUserId(userId);
          for (const sub of subs) {
            scopedSubs.push({ userId: sub.userId, token: sub.token });
          }
        }
      } else {
        const allSubs = yield* pushSubscriptionPort.findAll();
        for (const sub of allSubs) {
          scopedSubs.push({ userId: sub.userId, token: sub.token });
        }
      }

      if (scopedSubs.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
        };
      }

      // In test mode, simulate successful delivery to all subscriptions
      const sentCount = scopedSubs.length;

      // Record the mobile notification
      self.mobileNotifications.push({
        notificationId,
        sent: sentCount,
        failed: 0,
        total: hasExplicitAudience ? pushes.length : sentCount,
        timestamp: new Date(),
      });

      return {
        success: true,
        sent: sentCount,
        failed: 0,
        total: hasExplicitAudience ? pushes.length : sentCount,
      };
    });
  }

  /**
   * Send ranking update notification
   *
   * Requires trip write access for the specified tripId.
   */
  sendRankingUpdate(params: { tripId: string; createdById: string }) {
    const { tripId } = params;
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify trip write access
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "write",
        });
      }

      // Ranking update notifications are sent via the same mechanism
      // as regular notifications. This is a placeholder for future
      // ranking-specific notification logic.

      // Record the ranking update
      self.sentNotifications.push({
        userIds: [],
        title: "Ranking Update",
        body: "Your ranking has been updated",
        url: "/rankings",
        tripId,
        createdById: params.createdById,
        timestamp: new Date(),
      });

      return {
        success: true,
        notificationId: tripId as NotificationId,
        recipientCount: 0,
      };
    });
  }

  /**
   * Create notification content for coins added
   */
  createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): NotificationContent {
    return {
      title: `Coins Added to ${groupName}`,
      body: `${amount} coins have been added${reason ? `: ${reason}` : ""}`,
      url: `/groups`,
    };
  }

  /**
   * Create notification content for coins removed
   */
  createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): NotificationContent {
    return {
      title: `Coins Removed from ${groupName}`,
      body: `${amount} coins have been removed${reason ? `: ${reason}` : ""}`,
      url: `/groups`,
    };
  }

  /**
   * Create notification content for new member
   */
  createNewMemberNotification(
    groupName: string,
    memberName: string,
  ): NotificationContent {
    return {
      title: `New Member in ${groupName}`,
      body: `${memberName} has joined the group`,
      url: `/groups`,
    };
  }

  // Test helper methods

  /**
   * Clear all recorded notifications
   */
  clear(): void {
    this.sentNotifications = [];
    this.mobileNotifications = [];
  }

  /**
   * Get all sent notifications for verification
   */
  getSentNotifications(): typeof this.sentNotifications {
    return [...this.sentNotifications];
  }

  /**
   * Get all mobile notification records for verification
   */
  getMobileNotifications(): typeof this.mobileNotifications {
    return [...this.mobileNotifications];
  }
}
