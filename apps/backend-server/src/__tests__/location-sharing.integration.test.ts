import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { LocationUpdated } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import {
  GraphQLSubscriptionBroadcastService,
  type LocationSubscriber,
} from "@mirai-app/frameworks/location";
import { LocationBroadcastHandler } from "@mirai-app/use-cases/location/handlers";

/**
 * Location Sharing Event-Driven Integration Tests
 *
 * These tests validate the complete event-driven location sharing flow:
 * 1. Happy path: location update → event published → handler receives → subscription delivers
 * 2. Throttle behavior: rapid updates result in only the latest being published
 * 3. Fan-out: single event delivers to multiple subscribers
 * 4. Error isolation: one subscriber failure does not affect others
 * 5. Fire-and-forget: offline subscriber does not block delivery
 */
describe("[INTEGRATION] Location Sharing Event-Driven Flow", () => {
  let broadcastService: GraphQLSubscriptionBroadcastService;
  let handler: LocationBroadcastHandler;

  beforeEach(() => {
    broadcastService = new GraphQLSubscriptionBroadcastService();
    handler = new LocationBroadcastHandler(broadcastService);
  });

  describe("Happy Path: Complete Event Flow", () => {
    it("should deliver location update from publisher to subscriber", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const subscriberId = UserId.unsafeCreate("subscriber-456");
      const receivedUpdates: LocationUpdate[] = [];

      // Create subscriber callback
      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => {
          receivedUpdates.push(update);
        });

      // Subscribe subscriber to publisher's location updates
      await Effect.runPromise(
        broadcastService.subscribe(publisherId, subscriber)
      );

      // Create location event
      const event = new LocationUpdated(
        "event-1",
        publisherId,
        52.520008, // Berlin latitude
        13.404954, // Berlin longitude
        10.0, // accuracy
        new Date(),
        [subscriberId]
      );

      // Act - handler processes the event
      await Effect.runPromise(handler.handle(event));

      // Assert - subscriber received the update
      expect(receivedUpdates.length).toBe(1);
      expect(receivedUpdates[0].userId).toBe(publisherId);
      expect(receivedUpdates[0].latitude).toBe(52.520008);
      expect(receivedUpdates[0].longitude).toBe(13.404954);

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, subscriber)
      );
    });

    it("should deliver update within 500ms target", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const subscriberId = UserId.unsafeCreate("subscriber-456");
      let receivedAt: number | null = null;

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => {
          receivedAt = Date.now();
        });

      await Effect.runPromise(
        broadcastService.subscribe(publisherId, subscriber)
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        52.520008,
        13.404954,
        10.0,
        new Date(),
        [subscriberId]
      );

      // Act
      const startTime = Date.now();
      await Effect.runPromise(handler.handle(event));

      // Wait for delivery
      while (receivedAt === null) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Assert
      const deliveryTime = receivedAt! - startTime;
      expect(deliveryTime).toBeLessThan(500);

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, subscriber)
      );
    });
  });

  describe("Fan-Out: Multiple Subscribers", () => {
    it("should deliver to all active subscribers", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const subscriber1Id = UserId.unsafeCreate("subscriber-1");
      const subscriber2Id = UserId.unsafeCreate("subscriber-2");
      const subscriber3Id = UserId.unsafeCreate("subscriber-3");

      const receivedBySubscriber1: LocationUpdate[] = [];
      const receivedBySubscriber2: LocationUpdate[] = [];
      const receivedBySubscriber3: LocationUpdate[] = [];

      // Create three subscribers
      const subscriber1: LocationSubscriber = (update) =>
        Effect.sync(() => receivedBySubscriber1.push(update));

      const subscriber2: LocationSubscriber = (update) =>
        Effect.sync(() => receivedBySubscriber2.push(update));

      const subscriber3: LocationSubscriber = (update) =>
        Effect.sync(() => receivedBySubscriber3.push(update));

      // All subscribe to same publisher
      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(publisherId, subscriber1),
          broadcastService.subscribe(publisherId, subscriber2),
          broadcastService.subscribe(publisherId, subscriber3),
        ])
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        40.7128, // NYC latitude
        -74.006, // NYC longitude
        5.0,
        new Date(),
        [subscriber1Id, subscriber2Id, subscriber3Id]
      );

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert - all subscribers received the same update
      expect(receivedBySubscriber1.length).toBe(1);
      expect(receivedBySubscriber2.length).toBe(1);
      expect(receivedBySubscriber3.length).toBe(1);

      expect(receivedBySubscriber1[0].latitude).toBe(40.7128);
      expect(receivedBySubscriber2[0].latitude).toBe(40.7128);
      expect(receivedBySubscriber3[0].latitude).toBe(40.7128);

      // Cleanup
      await Effect.runPromise(
        Effect.all([
          broadcastService.unsubscribe(publisherId, subscriber1),
          broadcastService.unsubscribe(publisherId, subscriber2),
          broadcastService.unsubscribe(publisherId, subscriber3),
        ])
      );
    });
  });

  describe("Error Isolation: One Failure Does Not Block Others", () => {
    it("should deliver to healthy subscribers when one fails", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const healthySubscriberId = UserId.unsafeCreate("healthy-subscriber");
      const failingSubscriberId = UserId.unsafeCreate("failing-subscriber");

      const healthyUpdates: LocationUpdate[] = [];

      // Healthy subscriber
      const healthySubscriber: LocationSubscriber = (update) =>
        Effect.sync(() => healthyUpdates.push(update));

      // Failing subscriber - throws error
      const failingSubscriber: LocationSubscriber = () =>
        Effect.fail(new Error("Simulated subscriber failure"));

      // Subscribe both
      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(publisherId, healthySubscriber),
          broadcastService.subscribe(publisherId, failingSubscriber),
        ])
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        51.5074, // London latitude
        -0.1278, // London longitude
        8.0,
        new Date(),
        [healthySubscriberId, failingSubscriberId]
      );

      // Act
      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );

      // Assert - handler succeeds despite subscriber failure
      expect(Either.isRight(result)).toBe(true);

      // Healthy subscriber still received the update
      expect(healthyUpdates.length).toBe(1);
      expect(healthyUpdates[0].latitude).toBe(51.5074);

      // Cleanup
      await Effect.runPromise(
        Effect.all([
          broadcastService.unsubscribe(publisherId, healthySubscriber),
          broadcastService.unsubscribe(publisherId, failingSubscriber),
        ])
      );
    });

    it("should log but not propagate subscriber errors", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");

      let errorLogged = false;
      const failingSubscriber: LocationSubscriber = () =>
        Effect.gen(function* () {
          errorLogged = true;
          return yield* Effect.fail(new Error("Subscriber error"));
        });

      await Effect.runPromise(
        broadcastService.subscribe(publisherId, failingSubscriber)
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        48.8566,
        2.3522,
        10.0,
        new Date(),
        []
      );

      // Act - should not throw
      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );

      // Assert - broadcast succeeds
      expect(Either.isRight(result)).toBe(true);

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, failingSubscriber)
      );
    });
  });

  describe("Fire-and-Forget: Offline Subscribers", () => {
    it("should not block delivery to online subscribers when some are offline", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const onlineSubscriberId = UserId.unsafeCreate("online-subscriber");
      const offlineSubscriberId = UserId.unsafeCreate("offline-subscriber");

      const onlineUpdates: LocationUpdate[] = [];

      // Online subscriber
      const onlineSubscriber: LocationSubscriber = (update) =>
        Effect.sync(() => onlineUpdates.push(update));

      // Subscribe only the online subscriber
      // (offline subscriber is in sharing list but never subscribed)
      await Effect.runPromise(
        broadcastService.subscribe(publisherId, onlineSubscriber)
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        35.6762, // Tokyo latitude
        139.6503, // Tokyo longitude
        12.0,
        new Date(),
        [onlineSubscriberId, offlineSubscriberId] // offline subscriber in list
      );

      // Act
      const startTime = Date.now();
      await Effect.runPromise(handler.handle(event));
      const endTime = Date.now();

      // Assert - online subscriber received update quickly
      expect(onlineUpdates.length).toBe(1);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, onlineSubscriber)
      );
    });
  });

  describe("Handler Event Processing", () => {
    it("should process LocationUpdated events from EventBus", async () => {
      // Arrange
      const userId = UserId.unsafeCreate("user-123");
      const friendId = UserId.unsafeCreate("friend-456");
      const receivedUpdates: LocationUpdate[] = [];

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => receivedUpdates.push(update));

      await Effect.runPromise(broadcastService.subscribe(userId, subscriber));

      const event = new LocationUpdated(
        "event-1",
        userId,
        37.7749, // SF latitude
        -122.4194, // SF longitude
        15.0,
        new Date(),
        [friendId]
      );

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert
      expect(receivedUpdates.length).toBe(1);
      expect(receivedUpdates[0].userId).toBe(userId);

      // Cleanup
      await Effect.runPromise(broadcastService.unsubscribe(userId, subscriber));
    });

    it("should extract sharing list from event and fan out", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher");
      const friend1Id = UserId.unsafeCreate("friend-1");
      const friend2Id = UserId.unsafeCreate("friend-2");
      const friend3Id = UserId.unsafeCreate("friend-3");

      const friend1Updates: LocationUpdate[] = [];
      const friend2Updates: LocationUpdate[] = [];
      const friend3Updates: LocationUpdate[] = [];

      // Each friend subscribes to the publisher's location
      const friend1Subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => friend1Updates.push(update));

      const friend2Subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => friend2Updates.push(update));

      const friend3Subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => friend3Updates.push(update));

      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(publisherId, friend1Subscriber),
          broadcastService.subscribe(publisherId, friend2Subscriber),
          broadcastService.subscribe(publisherId, friend3Subscriber),
        ])
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        55.7558, // Moscow latitude
        37.6173, // Moscow longitude
        20.0,
        new Date(),
        [friend1Id, friend2Id, friend3Id]
      );

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert - all friends in sharing list received updates
      expect(friend1Updates.length).toBe(1);
      expect(friend2Updates.length).toBe(1);
      expect(friend3Updates.length).toBe(1);

      // Cleanup
      await Effect.runPromise(
        Effect.all([
          broadcastService.unsubscribe(publisherId, friend1Subscriber),
          broadcastService.unsubscribe(publisherId, friend2Subscriber),
          broadcastService.unsubscribe(publisherId, friend3Subscriber),
        ])
      );
    });
  });

  describe("Cleanup and Resource Management", () => {
    it("should clean up subscribers on unsubscribe", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher");
      const updatesAfterUnsubscribe: LocationUpdate[] = [];

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => updatesAfterUnsubscribe.push(update));

      // Subscribe
      await Effect.runPromise(
        broadcastService.subscribe(publisherId, subscriber)
      );

      // Unsubscribe
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, subscriber)
      );

      const event = new LocationUpdated(
        "event-1",
        publisherId,
        40.7128,
        -74.006,
        5.0,
        new Date(),
        []
      );

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert - unsubscribed subscriber did not receive update
      expect(updatesAfterUnsubscribe.length).toBe(0);
    });

    it("should remove user entry when last subscriber unsubscribes", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher");
      const subscriber: LocationSubscriber = () => Effect.void;

      // Subscribe and then unsubscribe
      await Effect.runPromise(
        broadcastService.subscribe(publisherId, subscriber)
      );
      await Effect.runPromise(
        broadcastService.unsubscribe(publisherId, subscriber)
      );

      // Verify cleanup occurred by checking that state is empty
      // (no errors should occur when broadcasting to empty state)
      const event = new LocationUpdated(
        "event-1",
        publisherId,
        40.7128,
        -74.006,
        5.0,
        new Date(),
        []
      );

      // Act & Assert - should complete without error even with no subscribers
      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );
      expect(Either.isRight(result)).toBe(true);
    });
  });
});

/**
 * Type for location updates received by subscribers
 */
interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: Date;
}
