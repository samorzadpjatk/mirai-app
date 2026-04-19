import { Effect, Data } from "effect";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import type {
  INotificationServicePort,
  INotificationPort,
  IPushSubscriptionPort,
  PushSubscription,
} from "@mirai-app/domain";
import type { NotificationId } from "@mirai-app/domain";
import type { IPortError } from "@mirai-app/domain";
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
 * Notification Service Gateway
 *
 * Implements INotificationServicePort for sending push notifications.
 * Uses Expo Push Notification Service via expo-server-sdk.
 *
 * This gateway uses the AuthContext pattern for authorization. Send operations
 * verify trip write access via `AuthContextTag` and `AuthZPortTag`.
 * Content builder methods (create*Notification) are pure functions and don't require auth.
 */
export class ExpoNotificationServiceGateway implements INotificationServicePort {
  private expo: Expo;

  constructor(
    private notificationPort: INotificationPort,
    private pushSubscriptionPort: IPushSubscriptionPort,
  ) {
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

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
    const { userIds, title, body, url, tripId } = params;
    const pushSubscriptionPort = this.pushSubscriptionPort;
    const expo = this.expo;

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
      const userByToken = new Map<string, string>();

      for (const userId of userIds) {
        const subs = yield* pushSubscriptionPort.findByUserId(userId);
        for (const sub of subs) {
          if (Expo.isExpoPushToken(sub.token)) {
            tokens.push(sub.token);
            userByToken.set(sub.token, userId);
          }
        }
      }

      if (tokens.length === 0) {
        return {
          success: true,
          notificationId: userIds[0] as NotificationId,
          recipientCount: 0,
        };
      }

      // Create Expo push messages
      const messages: ExpoPushMessage[] = tokens.map((token) => ({
        to: token,
        title,
        body,
        data: { url },
        sound: "default",
        priority: "default",
      }));

      // Chunk and send notifications
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = yield* Effect.tryPromise({
          try: () => expo.sendPushNotificationsAsync(chunk),
          catch: (error) => new NotificationServiceError({ cause: error }),
        }).pipe(
          Effect.catchAll((error) =>
            Effect.logError("Failed to send push notification chunk").pipe(
              Effect.annotateLogs({ error }),
              Effect.map(() =>
                chunk.map(
                  (): ExpoPushTicket => ({
                    status: "error",
                    message: "network error",
                  }),
                )
              )
            )
          ),
        );
        tickets.push(...ticketChunk);
      }

      // Count successes and failures
      let successCount = 0;
      let failureCount = 0;

      for (const ticket of tickets) {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: failureCount === 0,
        notificationId: userIds[0] as NotificationId,
        recipientCount: successCount,
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
    const expo = this.expo;

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
      const scopedSubs: PushSubscription[] = [];

      if (hasExplicitAudience) {
        const pendingUserIds = new Set(targetUserIds);
        for (const userId of pendingUserIds) {
          const subs = yield* pushSubscriptionPort.findByUserId(userId);
          for (const sub of subs) {
            scopedSubs.push(sub);
          }
        }
      } else {
        const allSubs = yield* pushSubscriptionPort.findAll();
        scopedSubs.push(...allSubs);
      }

      if (scopedSubs.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
        };
      }

      // Create Expo push messages
      const messages: ExpoPushMessage[] = [];
      const userByToken = new Map<string, string>();

      for (const sub of scopedSubs) {
        if (!Expo.isExpoPushToken(sub.token)) continue;
        userByToken.set(sub.token, sub.userId);

        messages.push({
          to: sub.token,
          title: notification.title,
          body: notification.body,
          data: { url: notification.url },
          sound: "default",
          priority: "default",
        });
      }

      if (messages.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
        };
      }

      // Chunk and send notifications
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = yield* Effect.tryPromise({
          try: () => expo.sendPushNotificationsAsync(chunk),
          catch: (error) => new NotificationServiceError({ cause: error }),
        }).pipe(
          Effect.catchAll((error) =>
            Effect.logError("Failed to send mobile notification chunk").pipe(
              Effect.annotateLogs({ error }),
              Effect.map(() =>
                chunk.map(
                  (): ExpoPushTicket => ({
                    status: "error",
                    message: "network error",
                  }),
                )
              )
            )
          ),
        );
        tickets.push(...ticketChunk);
      }

      // Map results to users
      const resultByUser = new Map<
        string,
        { hasSuccess: boolean; hasFailure: boolean }
      >();

      tickets
        .map((t, idx) => {
          const token = messages[idx]?.to;
          if (!token || typeof token !== "string") return null;
          const userId = userByToken.get(token);
          if (!userId) return null;
          const statusCode = t.status === "ok" ? 200 : 500;
          return { userId, statusCode };
        })
        .filter(
          (r): r is { userId: string; statusCode: number } => r !== null,
        )
        .forEach((r) => {
          const current = resultByUser.get(r.userId) ?? {
            hasSuccess: false,
            hasFailure: false,
          };
          if (r.statusCode >= 200 && r.statusCode < 300) {
            current.hasSuccess = true;
          } else {
            current.hasFailure = true;
          }
          resultByUser.set(r.userId, current);
        });

      // Count results
      const sentUserIds = Array.from(resultByUser.entries())
        .filter(([, status]) => status.hasSuccess)
        .map(([userId]) => userId);

      const failedUserIds = Array.from(resultByUser.entries())
        .filter(([, status]) => !status.hasSuccess && status.hasFailure)
        .map(([userId]) => userId);



      const sentCount = sentUserIds.length;
      const failedCount = hasExplicitAudience
        ? pushes.filter((p) => {
            const status = resultByUser.get(p.targetUserId);
            if (!status) return true;
            return !status.hasSuccess;
          }).length
        : failedUserIds.length;

      const totalCount = hasExplicitAudience
        ? pushes.length
        : sentUserIds.length + failedUserIds.length;

      return {
        success: failedCount === 0,
        sent: sentCount,
        failed: failedCount,
        total: totalCount,
      };
    });
  }

  /**
   * Send ranking update notification
   *
   * Requires trip write access for the specified tripId.
   * Sends notification to all trip participants with the current group rankings.
   */
  sendRankingUpdate(params: {
    tripId: string;
    createdById: string;
    groups: {
      id: string;
      name: string;
      coins: number;
      rank: number;
    }[];
    userIds: string[];
  }) {
    const { tripId, createdById, groups, userIds } = params;
    const pushSubscriptionPort = this.pushSubscriptionPort;
    const expo = this.expo;

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

      // Build ranking message
      const topGroups = groups.slice(0, 3);
      const rankingText = topGroups
        .map((g, index) => `${index + 1}. ${g.name} (${g.coins} coins)`)
        .join("\n");

      const title = "Group Rankings Updated";
      const body =
        groups.length > 0
          ? `Current top groups:\n${rankingText}`
          : "Group rankings have been updated";
      const url = `/trips/${tripId}/rankings`;

      // Fetch push subscriptions for target users
      const tokens: string[] = [];
      const userByToken = new Map<string, string>();

      for (const userId of userIds) {
        const subs = yield* pushSubscriptionPort.findByUserId(userId);
        for (const sub of subs) {
          if (Expo.isExpoPushToken(sub.token)) {
            tokens.push(sub.token);
            userByToken.set(sub.token, userId);
          }
        }
      }

      if (tokens.length === 0) {
        return {
          success: true,
          notificationId: tripId as NotificationId,
          recipientCount: 0,
        };
      }

      // Create Expo push messages
      const messages: ExpoPushMessage[] = tokens.map((token) => ({
        to: token,
        title,
        body,
        data: { url },
        sound: "default",
        priority: "default",
      }));

      // Chunk and send notifications
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = yield* Effect.tryPromise({
          try: () => expo.sendPushNotificationsAsync(chunk),
          catch: (error) => new NotificationServiceError({ cause: error }),
        }).pipe(
          Effect.catchAll((error) =>
            Effect.logError("Failed to send ranking update chunk").pipe(
              Effect.annotateLogs({ error }),
              Effect.map(() =>
                chunk.map(
                  (): ExpoPushTicket => ({
                    status: "error",
                    message: "network error",
                  }),
                ),
              ),
            ),
          ),
        );
        tickets.push(...ticketChunk);
      }

      // Count successes and failures
      let successCount = 0;
      let failureCount = 0;

      for (const ticket of tickets) {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: failureCount === 0,
        notificationId: tripId as NotificationId,
        recipientCount: successCount,
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
  ) {
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
  ) {
    return {
      title: `Coins Removed from ${groupName}`,
      body: `${amount} coins have been removed${reason ? `: ${reason}` : ""}`,
      url: `/groups`,
    };
  }

  /**
   * Create notification content for new member
   */
  createNewMemberNotification(groupName: string, memberName: string) {
    return {
      title: `New Member in ${groupName}`,
      body: `${memberName} has joined the group`,
      url: `/groups`,
    };
  }
}
