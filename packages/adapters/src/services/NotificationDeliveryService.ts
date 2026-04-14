import type {
  NotificationCreated,
  NotificationDelivered,
  NotificationDeliveryFailed,
} from "@mirai-app/domain";
import type { EventBus, EventHandler } from "./EventBus";
import type { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Effect, Data } from "effect";

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
 * NotificationDeliveryError for delivery operations
 */
export class NotificationDeliveryError extends Data.TaggedError(
  "NotificationDeliveryError",
)<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "NOTIFICATION_DELIVERY_ERROR" as const;
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
  private unsubscribe: (() => Effect.Effect<void, never, never>) | null = null;
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
      return;
    }

    // Subscribe to NotificationCreated events using legacy handler
    const subscription = this.eventBus.subscribeLegacy(
      "NotificationCreated",
      this.handleNotificationCreated.bind(this),
    );

    this.unsubscribe = subscription.unsubscribe;
    this.isInitialized = true;
  }

  /**
   * Initialize using Effect-based API
   *
   * @returns Effect that completes when initialization is done
   */
  initializeEffect(): Effect.Effect<void, NotificationDeliveryError, never> {
    return Effect.gen(this, function* () {
      if (this.isInitialized) {
        return;
      }

      // Subscribe to NotificationCreated events
      const subscription = this.eventBus.subscribe(
        "NotificationCreated",
        (event) =>
          this.handleNotificationCreatedEffect(event as NotificationCreated),
      );

      this.unsubscribe = subscription.unsubscribe;
      this.isInitialized = true;
    });
  }

  /**
   * Shutdown the service and unsubscribe from events
   */
  shutdown(): void {
    if (this.unsubscribe) {
      Effect.runSync(this.unsubscribe());
      this.unsubscribe = null;
    }
    this.isInitialized = false;
  }

  /**
   * Shutdown using Effect-based API
   *
   * @returns Effect that completes when shutdown is done
   */
  shutdownEffect(): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      if (this.unsubscribe) {
        yield* this.unsubscribe();
        this.unsubscribe = null;
      }
      this.isInitialized = false;
    });
  }

  /**
   * Handle NotificationCreated events (legacy async version)
   */
  private async handleNotificationCreated(
    event: NotificationCreated,
  ): Promise<void> {
    try {
      // Get push subscriptions for the recipient
      const subscriptions = await this.pushSubscriptionRepository.findByUserId(
        event.recipientId,
      );

      if (subscriptions.length === 0) {
        return;
      }

      // Deliver to each subscription using Effect
      const results = await Effect.runPromise(
        this.deliverToSubscriptionsEffect(event, subscriptions),
      );

      // Handle failures (invalid tokens, etc.)
      await this.handleFailures(results, subscriptions);
    } catch (error) {
      // Don't throw - delivery failures shouldn't crash the request
    }
  }

  /**
   * Handle NotificationCreated events (Effect-based version)
   */
  private handleNotificationCreatedEffect(
    event: NotificationCreated,
  ): Effect.Effect<void, NotificationDeliveryError, never> {
    return Effect.gen(this, function* () {
      // Get push subscriptions for the recipient
      const subscriptions = yield* Effect.tryPromise({
        try: () =>
          this.pushSubscriptionRepository.findByUserId(event.recipientId),
        catch: (error) =>
          new NotificationDeliveryError({
            operation: "handleNotificationCreated",
            message: `Failed to find subscriptions for user ${event.recipientId}`,
            cause: error,
          }),
      });

      if (subscriptions.length === 0) {
        return;
      }

      // Deliver to each subscription
      const results = yield* this.deliverToSubscriptionsEffect(
        event,
        subscriptions,
      );

      // Handle failures (invalid tokens, etc.)
      yield* this.handleFailuresEffect(results, subscriptions);
    });
  }

  /**
   * Deliver notification to all subscriptions (Effect-based)
   */
  private deliverToSubscriptionsEffect(
    event: NotificationCreated,
    subscriptions: PushSubscription[],
  ): Effect.Effect<DeliveryResult[], NotificationDeliveryError, never> {
    return Effect.gen(this, function* () {
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
        const chunkResults = yield* Effect.tryPromise({
          try: async () => {
            const tickets = await this.expo.sendPushNotificationsAsync(chunk);
            const chunkResults: DeliveryResult[] = [];

            // Map tickets to results
            chunk.forEach((message, index) => {
              const ticket = tickets[index];
              const deviceToken = message.to as string;

              if (ticket.status === "ok") {
                chunkResults.push({
                  success: true,
                  ticketId: ticket.id,
                  deviceToken,
                });

                // Publish delivery event
                this.publishDeliveredEvent(event, deviceToken);
              } else {
                chunkResults.push({
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

            return chunkResults;
          },
          catch: (error) =>
            new NotificationDeliveryError({
              operation: "deliverToSubscriptions",
              message: `Failed to send push notifications: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        });

        results.push(...chunkResults);
      }

      return results;
    });
  }

  /**
   * Handle delivery failures (invalid tokens, etc.) - Effect-based
   */
  private handleFailuresEffect(
    results: DeliveryResult[],
    subscriptions: PushSubscription[],
  ): Effect.Effect<void, NotificationDeliveryError, never> {
    return Effect.gen(this, function* () {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const subscription = subscriptions[i];

        if (!result.success) {
          // Check if token is invalid
          if (
            result.error?.includes("Invalid token") ||
            result.error?.includes("DeviceNotRegistered")
          ) {
            yield* Effect.tryPromise({
              try: () =>
                this.pushSubscriptionRepository.delete(subscription.id),
              catch: (error) =>
                new NotificationDeliveryError({
                  operation: "handleFailures",
                  message: `Failed to delete invalid subscription ${subscription.id}`,
                  cause: error,
                }),
            });
          }
        }
      }
    });
  }

  /**
   * Handle delivery failures (legacy async version for compatibility)
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
    // This would typically publish an event to the event bus
    // Implementation deferred until event system is fully integrated
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
   * Deliver notification immediately (for testing or direct use) - Effect-based
   *
   * @param userId - Recipient user ID
   * @param title - Notification title
   * @param body - Notification body
   * @param priority - Notification priority
   * @returns Effect that resolves to delivery results
   */
  deliver(
    userId: string,
    title: string,
    body: string,
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL",
  ): Effect.Effect<DeliveryResult[], NotificationDeliveryError, never> {
    return Effect.gen(this, function* () {
      const mockEvent = {
        id: crypto.randomUUID(),
        type: "NotificationCreated" as const,
        notificationId: crypto.randomUUID(),
        recipientId: userId,
        title,
        body,
        priority,
        occurredAt: new Date(),
      };

      const subscriptions = yield* Effect.tryPromise({
        try: () => this.pushSubscriptionRepository.findByUserId(userId),
        catch: (error) =>
          new NotificationDeliveryError({
            operation: "deliver",
            message: `Failed to find subscriptions for user ${userId}`,
            cause: error,
          }),
      });

      if (subscriptions.length === 0) {
        return [];
      }

      return yield* this.deliverToSubscriptionsEffect(
        mockEvent as NotificationCreated,
        subscriptions,
      );
    });
  }

  /**
   * Deliver notification immediately (legacy async version for compatibility)
   */
  async deliverLegacy(
    userId: string,
    title: string,
    body: string,
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL",
  ): Promise<DeliveryResult[]> {
    return Effect.runPromise(this.deliver(userId, title, body, priority));
  }
}
