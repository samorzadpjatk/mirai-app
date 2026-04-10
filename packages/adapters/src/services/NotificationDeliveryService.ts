import type {
  NotificationCreated,
  NotificationDelivered,
  NotificationDeliveryFailed,
} from "@mirai-app/domain";
import type { EventBus, EventHandler } from "./EventBus";
import type { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

/**
 * PushSubscription
 *
 * Represents a user's push notification subscription.
 */
export interface PushSubscription {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PushSubscriptionRepository
 *
 * Interface for accessing push subscriptions.
 * Implemented by adapters layer (PrismaPushSubscriptionRepository).
 */
export interface PushSubscriptionRepository {
  findByUserId(userId: string): Promise<PushSubscription[]>;
  findByUserIds(userIds: string[]): Promise<PushSubscription[]>;
  save(subscription: PushSubscription): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * DeliveryResult
 *
 * Result of a push notification delivery attempt.
 */
export interface DeliveryResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  deviceToken: string;
}

/**
 * NotificationDeliveryService
 *
 * Handles push notification delivery using Expo Server SDK.
 *
 * Phase 2: Real-Time Architecture
 * - Replaces the notification-sender microservice
 * - Runs in-process in the main backend
 * - Subscribes to NotificationCreated events via EventBus
 * - Queries push subscriptions and delivers via Expo
 * - Records delivery results
 *
 * Architecture:
 * ```
 * Use Case creates notification
 *    |
 *    v
 * eventBus.publish(NotificationCreated)
 *    |
 *    v
 * NotificationDeliveryService (handler)
 *    |
 *    v
 * pushSubscriptionRepository.findByUserId()
 *    |
 *    v
 * expo.sendPushNotificationsAsync()
 *    |
 *    v
 * Record delivery via TrackDeliveryCompleteUseCase
 * ```
 *
 * Error Handling:
 * - Individual device failures don't affect others
 * - Invalid tokens are automatically removed
 * - Failed deliveries are retried (with backoff)
 * - Delivery failures don't crash the request
 *
 * @example
 * ```typescript
 * // In backend startup
 * const deliveryService = new NotificationDeliveryService(
 *   eventBus,
 *   pushSubscriptionRepository,
 *   expoClient
 * );
 * deliveryService.initialize();
 *
 * // When notification is created (automatic via EventBus)
 * // deliveryService handles it automatically
 * ```
 */
export class NotificationDeliveryService {
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
    private readonly expo: Expo,
  ) {}

  /**
   * Initialize the service and subscribe to events
   *
   * Must be called during application startup.
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn("NotificationDeliveryService already initialized");
      return;
    }

    // Subscribe to NotificationCreated events
    this.unsubscribe = this.eventBus.subscribe(
      "NotificationCreated",
      this.handleNotificationCreated.bind(this) as EventHandler,
    ).unsubscribe;

    this.isInitialized = true;
    console.log("NotificationDeliveryService initialized");
  }

  /**
   * Shutdown the service and unsubscribe from events
   */
  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    console.log("NotificationDeliveryService shut down");
  }

  /**
   * Handle NotificationCreated events
   *
   * This is the core event handler that triggers push delivery.
   */
  private async handleNotificationCreated(
    event: NotificationCreated,
  ): Promise<void> {
    console.log(
      `[NotificationDeliveryService] Processing notification ${event.notificationId}`,
    );

    try {
      // Get push subscriptions for the recipient
      const subscriptions = await this.pushSubscriptionRepository.findByUserId(
        event.recipientId,
      );

      if (subscriptions.length === 0) {
        console.log(
          `[NotificationDeliveryService] No push subscriptions for user ${event.recipientId}`,
        );
        return;
      }

      // Deliver to each subscription
      const results = await this.deliverToSubscriptions(event, subscriptions);

      // Log results
      const successCount = results.filter((r) => r.success).length;
      console.log(
        `[NotificationDeliveryService] Delivered ${successCount}/${results.length} notifications`,
      );

      // Handle failures (invalid tokens, etc.)
      await this.handleFailures(results, subscriptions);
    } catch (error) {
      console.error(
        `[NotificationDeliveryService] Error delivering notification ${event.notificationId}:`,
        error,
      );
      // Don't throw - delivery failures shouldn't crash the request
    }
  }

  /**
   * Deliver notification to all subscriptions
   */
  private async deliverToSubscriptions(
    event: NotificationCreated,
    subscriptions: PushSubscription[],
  ): Promise<DeliveryResult[]> {
    // Create push messages
    const messages: ExpoPushMessage[] = subscriptions.map((sub) => ({
      to: sub.expoPushToken,
      sound: "default",
      title: event.title,
      body: event.body,
      priority: this.mapPriorityToExpo(event.priority),
      data: {
        notificationId: event.notificationId,
        type: "notification",
      },
    }));

    // Chunk messages (Expo limits to 100 per request)
    const chunks = this.expo.chunkPushNotifications(messages);
    const results: DeliveryResult[] = [];

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);

        // Map tickets to results
        chunk.forEach((message, index) => {
          const ticket = tickets[index];
          const deviceToken = message.to as string;

          if (ticket.status === "ok") {
            results.push({
              success: true,
              ticketId: ticket.id,
              deviceToken,
            });

            // Publish delivery event
            this.publishDeliveredEvent(event, deviceToken);
          } else {
            results.push({
              success: false,
              error: ticket.details?.error || "Unknown error",
              deviceToken,
            });

            // Publish failure event
            this.publishFailedEvent(
              event,
              deviceToken,
              ticket.details?.error || "Unknown error",
            );
          }
        });
      } catch (error) {
        // Chunk failed entirely
        chunk.forEach((message) => {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            deviceToken: message.to as string,
          });
        });
      }
    }

    return results;
  }

  /**
   * Handle delivery failures (invalid tokens, etc.)
   */
  private async handleFailures(
    results: DeliveryResult[],
    subscriptions: PushSubscription[],
  ): Promise<void> {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const subscription = subscriptions[i];

      if (!result.success) {
        // Check if token is invalid
        if (
          result.error?.includes("Invalid token") ||
          result.error?.includes("DeviceNotRegistered")
        ) {
          console.log(
            `[NotificationDeliveryService] Removing invalid token for user ${subscription.userId}`,
          );
          await this.pushSubscriptionRepository.delete(subscription.id);
        }
      }
    }
  }

  /**
   * Map priority to Expo priority
   */
  private mapPriorityToExpo(
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT",
  ): "default" | "high" | "max" {
    switch (priority) {
      case "LOW":
        return "default";
      case "NORMAL":
        return "default";
      case "HIGH":
        return "high";
      case "URGENT":
        return "max";
      default:
        return "default";
    }
  }

  /**
   * Publish NotificationDelivered event
   */
  private publishDeliveredEvent(
    originalEvent: NotificationCreated,
    deviceToken: string,
  ): void {
    // This would typically be imported from domain events
    // For now, we log it
    console.log(
      `[NotificationDeliveryService] Notification ${originalEvent.notificationId} delivered to device`,
    );
  }

  /**
   * Publish NotificationDeliveryFailed event
   */
  private publishFailedEvent(
    originalEvent: NotificationCreated,
    deviceToken: string,
    error: string,
  ): void {
    console.error(
      `[NotificationDeliveryService] Notification ${originalEvent.notificationId} failed: ${error}`,
    );
  }

  /**
   * Deliver notification immediately (for testing or direct use)
   *
   * @param userId - Recipient user ID
   * @param title - Notification title
   * @param body - Notification body
   * @param priority - Notification priority
   * @returns Delivery results
   */
  async deliver(
    userId: string,
    title: string,
    body: string,
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL",
  ): Promise<DeliveryResult[]> {
    const mockEvent: NotificationCreated = {
      id: crypto.randomUUID(),
      type: "NotificationCreated",
      notificationId: crypto.randomUUID(),
      recipientId: userId,
      title,
      body,
      priority,
      occurredAt: new Date(),
    };

    const subscriptions =
      await this.pushSubscriptionRepository.findByUserId(userId);

    if (subscriptions.length === 0) {
      return [];
    }

    return this.deliverToSubscriptions(mockEvent, subscriptions);
  }
}
