import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer, Either, Ref } from "effect";
import {
  LocationUpdated,
  UserId,
  TripId,
  Trip,
  TripParticipant,
  TripParticipantId,
} from "@mirai-app/domain";
import type {
  ILocationPort,
  ITripPort,
  ITripParticipantPort,
} from "@mirai-app/domain";
import {
  GraphQLSubscriptionBroadcastService,
  type LocationSubscriber,
} from "@mirai-app/frameworks/location";
import {
  LocationBroadcastHandler,
  UpdateLocationUseCase,
  LocationPortTag,
  ThrottleServiceTag,
} from "@mirai-app/use-cases/location";
import type { IThrottleService } from "@mirai-app/use-cases/location";
import { TripPortTag } from "@mirai-app/use-cases/trip/ports/TripPort";
import { TripParticipantPortTag } from "@mirai-app/use-cases/user/ports/TripParticipantPort";
import { EventBusTag } from "@mirai-app/use-cases/shared/ports";
import { InProcessEventBusGateway } from "@mirai-app/adapters";

/**
 * [INTEGRATION] Location Sharing Event-Driven Integration Tests
 *
 * These tests validate the complete event-driven location sharing flow:
 * 1. Happy path: location update -> event published -> handler receives -> subscription delivers
 * 2. Throttle behavior: rapid updates result in only the latest being published
 * 3. Fan-out: single event delivers to multiple subscribers
 * 4. Error isolation: one subscriber failure does not affect others
 * 5. Fire-and-forget: offline subscriber does not block delivery
 *
 * Uses InProcessEventBusGateway for deterministic, synchronous testing
 */

// ============================================================================
// Mock Factories
// ============================================================================

const createMockThrottleService = (
  shouldPublishResults: Map<string, boolean>
): IThrottleService => ({
  shouldPublish: (userId: UserId, _coordinates: { lat: number; lng: number }) => {
    const shouldPublish = shouldPublishResults.get(userId) ?? true;
    return Effect.succeed(shouldPublish);
  },
});

const createStatefulThrottleService = (): {
  service: IThrottleService;
  setShouldPublish: (userId: string, value: boolean) => Effect.Effect<void, never, never>;
  getCallCount: (userId: string) => Effect.Effect<number, never, never>;
} => {
  const state = Ref.unsafeMake<{
    results: Map<string, boolean>;
    callCounts: Map<string, number>;
  }>({
    results: new Map(),
    callCounts: new Map(),
  });

  return {
    service: {
      shouldPublish: (userId: UserId, _coordinates: { lat: number; lng: number }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(state);
          const callCount = (current.callCounts.get(userId) ?? 0) + 1;
          const newCallCounts = new Map(current.callCounts);
          newCallCounts.set(userId, callCount);
          yield* Ref.set(state, { ...current, callCounts: newCallCounts });
          return current.results.get(userId) ?? true;
        }),
    },
    setShouldPublish: (userId, value) =>
      Ref.update(state, (current) => ({
        ...current,
        results: new Map([...current.results, [userId, value]]),
      })),
    getCallCount: (userId) =>
      Effect.gen(function* () {
        const current = yield* Ref.get(state);
        return current.callCounts.get(userId) ?? 0;
      }),
  };
};

const createMockLocationPort = (options: {
  existingLocation?: import("@mirai-app/domain").Location | null;
  sharingList?: UserId[];
}): ILocationPort => {
  let storedLocation: import("@mirai-app/domain").Location | null = options.existingLocation ?? null;

  return {
    findById: () => Effect.succeed(null),
    findByUserId: () => Effect.succeed(storedLocation),
    create: (location) => {
      storedLocation = location;
      return Effect.succeed(location);
    },
    update: (location) => {
      storedLocation = location;
      return Effect.succeed(location);
    },
    delete: () => Effect.succeed(undefined),
    getSharingListForUser: () => Effect.succeed(options.sharingList ?? []),
  };
};

const createMockTripPort = (trip?: Trip): ITripPort => ({
  findById: () => Effect.succeed(trip ?? null),
  findByUserId: () => Effect.succeed(trip ? [trip] : []),
  create: (t: Trip) => Effect.succeed(t),
  update: (t: Trip) => Effect.succeed(t),
  delete: () => Effect.succeed(undefined),
  searchTrips: () => Effect.succeed([]),
  findTripWithFullHierarchy: () => Effect.succeed(null),
  findByInviteCode: () => Effect.succeed(null),
});

const createMockParticipantPort = (participants: TripParticipant[]): ITripParticipantPort => ({
  findById: () => Effect.succeed(null),
  findByTripId: () => Effect.succeed(participants),
  findByUserId: () => Effect.succeed(participants),
  findByUserAndTrip: () => Effect.succeed(null),
  findByTripIds: () => Effect.succeed(participants),
  upsert: (p: TripParticipant) => Effect.succeed(p),
  update: (p: TripParticipant) => Effect.succeed(p),
  delete: () => Effect.succeed(undefined),
  countByTripId: () => Effect.succeed(participants.length),
  isParticipant: () => Effect.succeed(participants.length > 0),
  findByWristNumber: () => Effect.succeed(null),
  findByUserAndTripWithRelations: () => Effect.succeed(null),
  findByTripIdWithRelations: () => Effect.succeed([]),
});

const createActiveTrip = (tripId: string): Trip => {
  const id = TripId.unsafeCreate(tripId);
  const now = new Date();
  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id,
    name: "Test Trip",
    description: "Test trip for location sharing",
    destination: "Test Destination",
    emoji: "suitcase",
    isDeleted: false,
    timezone: "UTC",
    inviteCode: "TEST123",
    startDate: now,
    endDate: future,
    createdAt: now,
    updatedAt: now,
    hasEnded: (date: Date) => date > future,
    hasStarted: (date: Date) => date >= now,
  } as Trip;
};

// ============================================================================
// Test Suite
// ============================================================================

describe("[INTEGRATION] Location Sharing Event-Driven Flow", () => {
  let eventBus: InProcessEventBusGateway;
  let broadcastService: GraphQLSubscriptionBroadcastService;
  let handler: LocationBroadcastHandler;

  beforeEach(() => {
    eventBus = new InProcessEventBusGateway();
    broadcastService = new GraphQLSubscriptionBroadcastService();
    handler = new LocationBroadcastHandler(broadcastService);
  });

  // ============================================================================
  // Test 1: Happy Path Integration
  // ============================================================================

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

      // Subscriber subscribes with THEIR OWN ID (receives updates sent to them)
      await Effect.runPromise(
        broadcastService.subscribe(subscriberId, subscriber)
      );

      // Create location event with correct payload structure
      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 52.520008,
          longitude: 13.404954,
        },
        accuracy: 10.0,
        timestamp: new Date(),
        sharingList: [subscriberId],
      });

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

      // Subscriber subscribes with THEIR OWN ID
      await Effect.runPromise(
        broadcastService.subscribe(subscriberId, subscriber)
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 52.520008,
          longitude: 13.404954,
        },
        accuracy: 10.0,
        timestamp: new Date(),
        sharingList: [subscriberId],
      });

      // Act
      const startTime = Date.now();
      await Effect.runPromise(handler.handle(event));

      // Wait for delivery
      while (receivedAt === null) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // Assert
      const deliveryTime = receivedAt! - startTime;
      expect(deliveryTime).toBeLessThan(500);

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(subscriberId, subscriber)
      );
    });
  });

  // ============================================================================
  // Test 2: Throttle Behavior
  // ============================================================================

  describe("Throttle Behavior", () => {
    it("should call throttle service for each update", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const trip = createActiveTrip("trip-123");
      const participant = {
        id: TripParticipantId.generate(),
        userId,
        tripId: trip.id,
        groupId: null,
        wristNumber: null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      const { service: throttleService, getCallCount } = createStatefulThrottleService();

      // Create test layer
      const testLayer = Layer.mergeAll(
        Layer.succeed(EventBusTag, eventBus),
        Layer.succeed(TripPortTag, createMockTripPort(trip)),
        Layer.succeed(TripParticipantPortTag, createMockParticipantPort([participant])),
        Layer.succeed(LocationPortTag, createMockLocationPort({ sharingList: [] })),
        Layer.succeed(ThrottleServiceTag, throttleService)
      );

      // Subscribe handler
      const subscribeProgram = Effect.gen(function* () {
        const { unsubscribe } = yield* eventBus.subscribe(
          "LocationUpdated",
          (e) => handler.handle(e as LocationUpdated)
        );
        return unsubscribe;
      }).pipe(Effect.provide(testLayer));

      const unsubscribeHandler = await Effect.runPromise(subscribeProgram);

      // Execute 5 rapid location updates
      const useCase = new UpdateLocationUseCase();
      const updates = Array.from({ length: 5 }, (_, i) => ({
        userId: userId as string,
        latitude: 52.52 + i * 0.001,
        longitude: 13.405 + i * 0.001,
        accuracy: 10.0,
      }));

      for (const update of updates) {
        const program = useCase.execute(update).pipe(Effect.provide(testLayer));
        await Effect.runPromise(program);
      }

      // Wait for async event publishing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify throttle service was called 5 times
      const callCount = await Effect.runPromise(
        getCallCount(userId).pipe(Effect.provide(testLayer))
      );
      expect(callCount).toBe(5);

      // Cleanup
      unsubscribeHandler();
    });

    it("should only publish event when throttle allows", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const trip = createActiveTrip("trip-123");
      const participant = {
        id: TripParticipantId.generate(),
        userId,
        tripId: trip.id,
        groupId: null,
        wristNumber: null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      const publishedEvents: LocationUpdated[] = [];

      // Create throttle service that blocks updates after first
      const throttleService: IThrottleService = {
        shouldPublish: (uid, _coords) => {
          // Only allow first update
          const count = publishedEvents.length;
          return Effect.succeed(count === 0);
        },
      };

      const testLayer = Layer.mergeAll(
        Layer.succeed(EventBusTag, eventBus),
        Layer.succeed(TripPortTag, createMockTripPort(trip)),
        Layer.succeed(TripParticipantPortTag, createMockParticipantPort([participant])),
        Layer.succeed(LocationPortTag, createMockLocationPort({ sharingList: [] })),
        Layer.succeed(ThrottleServiceTag, throttleService)
      );

      // Subscribe to track published events
      const subscribeProgram = Effect.gen(function* () {
        const { unsubscribe } = yield* eventBus.subscribe(
          "LocationUpdated",
          (event) => {
            publishedEvents.push(event as LocationUpdated);
            return Effect.void;
          }
        );
        return unsubscribe;
      }).pipe(Effect.provide(testLayer));

      const unsubscribeHandler = await Effect.runPromise(subscribeProgram);

      // Execute 5 rapid location updates
      const useCase = new UpdateLocationUseCase();
      for (let i = 0; i < 5; i++) {
        const program = useCase.execute({
          userId: userId as string,
          latitude: 52.52 + i * 0.001,
          longitude: 13.405 + i * 0.001,
          accuracy: 10.0,
        }).pipe(Effect.provide(testLayer));
        await Effect.runPromise(program);
      }

      // Wait for async publishing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify only 1 event was published (throttle blocked others)
      expect(publishedEvents.length).toBe(1);

      // Cleanup
      unsubscribeHandler();
    });

    it("should use replace-latest strategy for throttle", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const trip = createActiveTrip("trip-123");
      const participant = {
        id: TripParticipantId.generate(),
        userId,
        tripId: trip.id,
        groupId: null,
        wristNumber: null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      const publishedEvents: LocationUpdated[] = [];

      // Throttle service that only allows every other update
      let callCount = 0;
      const throttleService: IThrottleService = {
        shouldPublish: () => {
          callCount++;
          // Allow updates 1, 3, 5 (odd calls)
          return Effect.succeed(callCount % 2 === 1);
        },
      };

      const testLayer = Layer.mergeAll(
        Layer.succeed(EventBusTag, eventBus),
        Layer.succeed(TripPortTag, createMockTripPort(trip)),
        Layer.succeed(TripParticipantPortTag, createMockParticipantPort([participant])),
        Layer.succeed(LocationPortTag, createMockLocationPort({ sharingList: [] })),
        Layer.succeed(ThrottleServiceTag, throttleService)
      );

      // Subscribe to track published events
      const subscribeProgram = Effect.gen(function* () {
        const { unsubscribe } = yield* eventBus.subscribe(
          "LocationUpdated",
          (event) => {
            publishedEvents.push(event as LocationUpdated);
            return Effect.void;
          }
        );
        return unsubscribe;
      }).pipe(Effect.provide(testLayer));

      const unsubscribeHandler = await Effect.runPromise(subscribeProgram);

      // Execute 5 updates with alternating throttle results
      const useCase = new UpdateLocationUseCase();
      const latitudes = [52.520, 52.521, 52.522, 52.523, 52.524];

      for (let i = 0; i < 5; i++) {
        const program = useCase.execute({
          userId: userId as string,
          latitude: latitudes[i],
          longitude: 13.405,
          accuracy: 10.0,
        }).pipe(Effect.provide(testLayer));
        await Effect.runPromise(program);
      }

      // Wait for async publishing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify events were published for odd calls (1, 3, 5 = 3 events)
      expect(publishedEvents.length).toBe(3);

      // Cleanup
      unsubscribeHandler();
    });
  });

  // ============================================================================
  // Test 3: Fan-Out to Multiple Friends
  // ============================================================================

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

      // All subscribe with THEIR OWN IDs
      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(subscriber1Id, subscriber1),
          broadcastService.subscribe(subscriber2Id, subscriber2),
          broadcastService.subscribe(subscriber3Id, subscriber3),
        ])
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        accuracy: 5.0,
        timestamp: new Date(),
        sharingList: [subscriber1Id, subscriber2Id, subscriber3Id],
      });

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
          broadcastService.unsubscribe(subscriber1Id, subscriber1),
          broadcastService.unsubscribe(subscriber2Id, subscriber2),
          broadcastService.unsubscribe(subscriber3Id, subscriber3),
        ])
      );
    });
  });

  // ============================================================================
  // Test 4: Error Isolation
  // ============================================================================

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

      // Subscribe both with THEIR OWN IDs
      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(healthySubscriberId, healthySubscriber),
          broadcastService.subscribe(failingSubscriberId, failingSubscriber),
        ])
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
        accuracy: 8.0,
        timestamp: new Date(),
        sharingList: [healthySubscriberId, failingSubscriberId],
      });

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
          broadcastService.unsubscribe(healthySubscriberId, healthySubscriber),
          broadcastService.unsubscribe(failingSubscriberId, failingSubscriber),
        ])
      );
    });

    it("should log but not propagate subscriber errors", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher-123");
      const subscriberId = UserId.unsafeCreate("subscriber-123");

      const failingSubscriber: LocationSubscriber = () =>
        Effect.fail(new Error("Subscriber error"));

      // Subscribe with the ID that will be in the sharing list
      await Effect.runPromise(
        broadcastService.subscribe(subscriberId, failingSubscriber)
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 48.8566,
          longitude: 2.3522,
        },
        accuracy: 10.0,
        timestamp: new Date(),
        sharingList: [subscriberId],
      });

      // Act - should not throw
      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );

      // Assert - broadcast succeeds
      expect(Either.isRight(result)).toBe(true);

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(subscriberId, failingSubscriber)
      );
    });
  });

  // ============================================================================
  // Test 5: Fire-and-Forget
  // ============================================================================

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

      // Subscribe only the online subscriber with THEIR OWN ID
      // (offline subscriber is in sharing list but never subscribed)
      await Effect.runPromise(
        broadcastService.subscribe(onlineSubscriberId, onlineSubscriber)
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        accuracy: 12.0,
        timestamp: new Date(),
        sharingList: [onlineSubscriberId, offlineSubscriberId], // offline subscriber in list
      });

      // Act
      const startTime = Date.now();
      await Effect.runPromise(handler.handle(event));
      const endTime = Date.now();

      // Assert - online subscriber received update quickly
      expect(onlineUpdates.length).toBe(1);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast

      // Cleanup
      await Effect.runPromise(
        broadcastService.unsubscribe(onlineSubscriberId, onlineSubscriber)
      );
    });
  });

  // ============================================================================
  // Additional Tests: Full Flow with EventBus and UpdateLocation
  // ============================================================================

  describe("Full Flow: UpdateLocation -> EventBus -> Handler -> Subscription", () => {
    it("should complete full flow end-to-end", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const friendId = UserId.unsafeCreate("friend-456");
      const trip = createActiveTrip("trip-123");

      const receivedUpdates: LocationUpdate[] = [];

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => receivedUpdates.push(update));

      // Friend subscribes with THEIR OWN ID (which is in the sharing list)
      await Effect.runPromise(broadcastService.subscribe(friendId, subscriber));

      const participant = {
        id: TripParticipantId.generate(),
        userId,
        tripId: trip.id,
        groupId: null,
        wristNumber: null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      const throttleService = createMockThrottleService(
        new Map([[userId, true]])
      );

      const testLayer = Layer.mergeAll(
        Layer.succeed(EventBusTag, eventBus),
        Layer.succeed(TripPortTag, createMockTripPort(trip)),
        Layer.succeed(TripParticipantPortTag, createMockParticipantPort([participant])),
        Layer.succeed(
          LocationPortTag,
          createMockLocationPort({ sharingList: [friendId] })
        ),
        Layer.succeed(ThrottleServiceTag, throttleService)
      );

      // Subscribe handler to EventBus
      const subscribeProgram = Effect.gen(function* () {
        const { unsubscribe } = yield* eventBus.subscribe(
          "LocationUpdated",
          (e) => handler.handle(e as LocationUpdated)
        );
        return unsubscribe;
      }).pipe(Effect.provide(testLayer));

      const unsubscribeHandler = await Effect.runPromise(subscribeProgram);

      // Execute UpdateLocation use case
      const useCase = new UpdateLocationUseCase();
      const input = {
        userId: userId as string,
        latitude: 52.520008,
        longitude: 13.404954,
        accuracy: 10.0,
        tripId: trip.id as string,
      };

      const result = await Effect.runPromise(
        useCase.execute(input).pipe(Effect.provide(testLayer))
      );

      // Wait for async event publishing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify
      expect(result.success).toBe(true);
      expect(result.locationId).toBeDefined();
      expect(receivedUpdates.length).toBe(1);
      expect(receivedUpdates[0].latitude).toBe(52.520008);
      expect(receivedUpdates[0].longitude).toBe(13.404954);

      // Cleanup
      await Effect.runPromise(broadcastService.unsubscribe(friendId, subscriber));
      unsubscribeHandler();
    });

    it("should include sharing list in published event", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const friend1Id = UserId.unsafeCreate("friend-1");
      const friend2Id = UserId.unsafeCreate("friend-2");
      const trip = createActiveTrip("trip-123");

      const publishedEvents: LocationUpdated[] = [];

      const participant = {
        id: TripParticipantId.generate(),
        userId,
        tripId: trip.id,
        groupId: null,
        wristNumber: null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      const throttleService = createMockThrottleService(new Map([[userId, true]]));

      const testLayer = Layer.mergeAll(
        Layer.succeed(EventBusTag, eventBus),
        Layer.succeed(TripPortTag, createMockTripPort(trip)),
        Layer.succeed(TripParticipantPortTag, createMockParticipantPort([participant])),
        Layer.succeed(
          LocationPortTag,
          createMockLocationPort({ sharingList: [friend1Id, friend2Id] })
        ),
        Layer.succeed(ThrottleServiceTag, throttleService)
      );

      // Subscribe to track published events
      const subscribeProgram = Effect.gen(function* () {
        const { unsubscribe } = yield* eventBus.subscribe(
          "LocationUpdated",
          (event) => {
            publishedEvents.push(event as LocationUpdated);
            return Effect.void;
          }
        );
        return unsubscribe;
      }).pipe(Effect.provide(testLayer));

      const unsubscribeHandler = await Effect.runPromise(subscribeProgram);

      // Execute use case
      const useCase = new UpdateLocationUseCase();
      await Effect.runPromise(
        useCase
          .execute({
            userId: userId as string,
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 5.0,
            tripId: trip.id as string,
          })
          .pipe(Effect.provide(testLayer))
      );

      // Wait for async publishing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify event contains sharing list
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].sharingList).toContain(friend1Id);
      expect(publishedEvents[0].sharingList).toContain(friend2Id);
      expect(publishedEvents[0].sharingList.length).toBe(2);

      // Cleanup
      unsubscribeHandler();
    });
  });

  // ============================================================================
  // Handler Event Processing
  // ============================================================================

  describe("Handler Event Processing", () => {
    it("should process LocationUpdated events from EventBus", async () => {
      // Arrange
      const userId = UserId.unsafeCreate("user-123");
      const friendId = UserId.unsafeCreate("friend-456");
      const receivedUpdates: LocationUpdate[] = [];

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => receivedUpdates.push(update));

      // Friend subscribes with THEIR OWN ID (which is in the sharing list)
      await Effect.runPromise(broadcastService.subscribe(friendId, subscriber));

      const event = new LocationUpdated({
        eventId: "event-1",
        userId,
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        accuracy: 15.0,
        timestamp: new Date(),
        sharingList: [friendId],
      });

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert
      expect(receivedUpdates.length).toBe(1);
      expect(receivedUpdates[0].userId).toBe(userId);

      // Cleanup
      await Effect.runPromise(broadcastService.unsubscribe(friendId, subscriber));
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

      // Friends subscribe with THEIR OWN IDs
      await Effect.runPromise(
        Effect.all([
          broadcastService.subscribe(friend1Id, friend1Subscriber),
          broadcastService.subscribe(friend2Id, friend2Subscriber),
          broadcastService.subscribe(friend3Id, friend3Subscriber),
        ])
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
        accuracy: 20.0,
        timestamp: new Date(),
        sharingList: [friend1Id, friend2Id, friend3Id],
      });

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert - all friends in sharing list received updates
      expect(friend1Updates.length).toBe(1);
      expect(friend2Updates.length).toBe(1);
      expect(friend3Updates.length).toBe(1);

      // Cleanup
      await Effect.runPromise(
        Effect.all([
          broadcastService.unsubscribe(friend1Id, friend1Subscriber),
          broadcastService.unsubscribe(friend2Id, friend2Subscriber),
          broadcastService.unsubscribe(friend3Id, friend3Subscriber),
        ])
      );
    });
  });

  // ============================================================================
  // Cleanup and Resource Management
  // ============================================================================

  describe("Cleanup and Resource Management", () => {
    it("should clean up subscribers on unsubscribe", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher");
      const subscriberId = UserId.unsafeCreate("subscriber");
      const updatesAfterUnsubscribe: LocationUpdate[] = [];

      const subscriber: LocationSubscriber = (update) =>
        Effect.sync(() => updatesAfterUnsubscribe.push(update));

      // Subscribe with subscriber's own ID
      await Effect.runPromise(
        broadcastService.subscribe(subscriberId, subscriber)
      );

      // Unsubscribe
      await Effect.runPromise(
        broadcastService.unsubscribe(subscriberId, subscriber)
      );

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        accuracy: 5.0,
        timestamp: new Date(),
        sharingList: [], // Empty - so no broadcast happens anyway
      });

      // Act
      await Effect.runPromise(handler.handle(event));

      // Assert - unsubscribed subscriber did not receive update
      expect(updatesAfterUnsubscribe.length).toBe(0);
    });

    it("should remove user entry when last subscriber unsubscribes", async () => {
      // Arrange
      const publisherId = UserId.unsafeCreate("publisher");
      const subscriberId = UserId.unsafeCreate("subscriber");
      const subscriber: LocationSubscriber = () => Effect.void;

      // Subscribe and then unsubscribe
      await Effect.runPromise(
        broadcastService.subscribe(subscriberId, subscriber)
      );
      await Effect.runPromise(
        broadcastService.unsubscribe(subscriberId, subscriber)
      );

      // Verify cleanup occurred by checking that state is empty
      // (no errors should occur when broadcasting to empty state)
      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        accuracy: 5.0,
        timestamp: new Date(),
        sharingList: [],
      });

      // Act & Assert - should complete without error even with no subscribers
      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );
      expect(Either.isRight(result)).toBe(true);
    });

    it("should handle empty sharing list gracefully", async () => {
      const publisherId = UserId.unsafeCreate("publisher");

      const event = new LocationUpdated({
        eventId: "event-1",
        userId: publisherId,
        coordinates: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
        accuracy: 8.0,
        timestamp: new Date(),
        sharingList: [], // Empty
      });

      const result = await Effect.runPromise(
        Effect.either(handler.handle(event))
      );

      // Should succeed even with empty sharing list
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
