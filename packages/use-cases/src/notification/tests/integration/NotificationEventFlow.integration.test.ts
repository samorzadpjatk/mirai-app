import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer, Either, Schedule } from "effect";
import { SendNotificationToGroupUseCase } from "../../interactors/SendNotificationToGroup";
import { NotificationSendHandler } from "../../handlers/NotificationSendHandler";
import { GroupPortTag } from "../../../group/ports/GroupPort";
import { TripParticipantPortTag } from "../../../user/ports/TripParticipantPort";
import {
  NotificationServicePortTag,
  PushSubscriptionPortTag,
  NotificationDeliveryPortTag,
} from "../../ports/NotificationPort";
import { EventBusTag } from "../../../shared/ports/EventBusPort";
import { InProcessEventBusGateway } from "@mirai-app/adapters";
import {
  InMemoryPushSubscriptionGateway,
  InMemoryNotificationDeliveryGateway,
} from "@mirai-app/adapters";
import type {
  IGroupPort,
  ITripParticipantPort,
  INotificationServicePort,
  Group,
  TripId,
  GroupId,
  UserId,
  NotificationId,
  PushSubscription,
} from "@mirai-app/domain";

/**
 * [INTEGRATION] Notification Event Flow Test
 *
 * End-to-end flow verification:
 * 1. Use case publishes event
 * 2. Handler receives and processes
 * 3. Delivery status tracked in database
 * 4. Response time <100ms
 *
 * Uses InProcessEventBusGateway for deterministic, synchronous testing
 */

const createMockGroup = (id: string, tripId: string, isDeleted = false): Group =>
  ({
    id: id as GroupId,
    tripId: tripId as TripId,
    name: `Group ${id}`,
    description: "Test group",
    emoji: "party",
    isDeleted,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }) as Group;

const createMockGroupPort = (groups: Group[]): IGroupPort => ({
  findById: (id) => {
    const group = groups.find((g) => g.id === id);
    return Effect.succeed(group ?? null);
  },
  findByTripId: () => Effect.succeed(groups),
  findByTripIdWithDeleted: () => Effect.succeed(groups),
  findByTripIdWithStats: () =>
    Effect.succeed(groups.map((g) => ({ ...g, memberCount: 5, coins: 10 }))),
  create: (group) => Effect.succeed(group),
  update: (group) => Effect.succeed(group),
  delete: () => Effect.succeed(undefined),
  restore: () => Effect.succeed(undefined),
  moveToTrip: () => Effect.succeed(undefined),
  hardDelete: () => Effect.succeed(undefined),
  findAll: () => Effect.succeed([]),
});

const createMockParticipantPort = (
  participants: Array<{ id: string; userId: UserId; tripId: TripId; groupId: GroupId | null }>,
): ITripParticipantPort => ({
  findById: () => Effect.succeed(null),
  findByTripId: () =>
    Effect.succeed(
      participants.map((p) => ({
        ...p,
        wristNumber: null,
        joinedAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      })),
    ),
  findByUserId: () =>
    Effect.succeed(
      participants.map((p) => ({
        ...p,
        wristNumber: null,
        joinedAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      })),
    ),
  findByUserAndTrip: () => Effect.succeed(null),
  findByTripIds: () => Effect.succeed([]),
  upsert: (p) => Effect.succeed(p),
  update: (p) => Effect.succeed(p),
  delete: () => Effect.succeed(undefined),
  countByTripId: () => Effect.succeed(participants.length),
  isParticipant: () => Effect.succeed(true),
  findByWristNumber: () => Effect.succeed(null),
  findByUserAndTripWithRelations: () => Effect.succeed(null),
  findByTripIdWithRelations: () => Effect.succeed([]),
});

const createMockNotificationServicePort = (): INotificationServicePort => ({
  sendNotification: () =>
    Effect.succeed({
      success: true,
      notificationId: `notif-${crypto.randomUUID()}` as NotificationId,
      recipientCount: 2,
    }),
  sendMobileNotifications: () =>
    Effect.succeed({
      success: true,
      sent: 2,
      failed: 0,
      total: 2,
    }),
  sendRankingUpdate: () =>
    Effect.succeed({
      success: true,
      notificationId: `notif-${crypto.randomUUID()}` as NotificationId,
      recipientCount: 2,
    }),
  createCoinsAddedNotification: () => ({
    title: "Coins Added",
    body: "You received coins",
    url: "/coins",
  }),
  createCoinsRemovedNotification: () => ({
    title: "Coins Removed",
    body: "Coins were removed",
    url: "/coins",
  }),
  createNewMemberNotification: () => ({
    title: "New Member",
    body: "Someone joined",
    url: "/members",
  }),
});

describe("[INTEGRATION] Notification Event Flow", () => {
  let eventBus: InProcessEventBusGateway;
  let pushSubscriptionGateway: InMemoryPushSubscriptionGateway;
  let deliveryGateway: InMemoryNotificationDeliveryGateway;
  let handler: NotificationSendHandler;

  beforeEach(() => {
    // Create fresh instances for test isolation
    eventBus = new InProcessEventBusGateway();
    pushSubscriptionGateway = new InMemoryPushSubscriptionGateway();
    deliveryGateway = new InMemoryNotificationDeliveryGateway();
    handler = new NotificationSendHandler(
      // Fast schedule for testing to avoid timing issues
      Schedule.exponential(10).pipe(Schedule.intersect(Schedule.recurs(3)))
    );
  });

  it("should publish event and process through handler end-to-end", async () => {
    // Setup test data
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId1 = `user-${crypto.randomUUID()}`;
    const userId2 = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-1`, userId: userId1 as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-2`, userId: userId2 as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    // Seed push subscriptions for the handler
    const mockSubscriptions: PushSubscription[] = [
      {
        id: `sub-${userId1}` as PushSubscription["id"],
        userId: userId1 as PushSubscription["userId"],
        token: `expo-token-${userId1}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: `sub-${userId2}` as PushSubscription["id"],
        userId: userId2 as PushSubscription["userId"],
        token: `expo-token-${userId2}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    for (const sub of mockSubscriptions) {
      await Effect.runPromise(pushSubscriptionGateway.create(sub));
    }

    // Create test layer with all dependencies
    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
    );

    // Subscribe handler to event bus
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event)
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId,
      tripId,
      title: "Integration Test Notification",
      body: "This is an end-to-end test notification",
      url: "/test/integration",
      createdById: userId1,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    const result = await Effect.runPromise(executeProgram);

    // Verify use case result
    expect(result.success).toBe(true);
    expect(result.recipientCount).toBe(2);
    expect(result.id).toBeDefined();

    // Verify handler processed the event (check delivery status)
    // Since InProcessEventBusGateway is synchronous, handler should have completed
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);

    // Verify delivery was tracked
    expect(deliveries.length).toBeGreaterThanOrEqual(1);

    const delivery = deliveries[0];
    expect(delivery.status).toBe("success");
    expect(delivery.totalRecipients).toBe(2);
    expect(delivery.successCount).toBe(2);
    expect(delivery.failureCount).toBe(0);
    expect(delivery.deliveryStartedAt).toBeDefined();
    expect(delivery.deliveryCompletedAt).toBeDefined();

    // Cleanup
    unsubscribe();
  });

  it("should complete full flow with <100ms response time", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-1`, userId: userId as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    // Seed push subscription
    const mockSubscription: PushSubscription = {
      id: `sub-${userId}` as PushSubscription["id"],
      userId: userId as PushSubscription["userId"],
      token: `expo-token-${userId}`,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    await Effect.runPromise(pushSubscriptionGateway.create(mockSubscription));

    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event)
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Measure response time
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId,
      tripId,
      title: "Performance Test Notification",
      body: "Testing response time",
      url: "/test/perf",
      createdById: userId,
    };

    const startTime = performance.now();
    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    const result = await Effect.runPromise(executeProgram);
    const endTime = performance.now();

    const responseTime = endTime - startTime;

    // Verify response time < 100ms
    expect(responseTime).toBeLessThan(100);
    expect(result.success).toBe(true);

    // Verify handler completed
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);
    expect(deliveries.length).toBeGreaterThanOrEqual(1);

    // Cleanup
    unsubscribe();
  });

  it("should track delivery status through all states (pending -> success)", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId1 = `user-${crypto.randomUUID()}`;
    const userId2 = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-1`, userId: userId1 as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-2`, userId: userId2 as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    // Seed push subscriptions
    const mockSubscriptions: PushSubscription[] = [
      {
        id: `sub-${userId1}` as PushSubscription["id"],
        userId: userId1 as PushSubscription["userId"],
        token: `expo-token-${userId1}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: `sub-${userId2}` as PushSubscription["id"],
        userId: userId2 as PushSubscription["userId"],
        token: `expo-token-${userId2}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    for (const sub of mockSubscriptions) {
      await Effect.runPromise(pushSubscriptionGateway.create(sub));
    }

    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event)
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId,
      tripId,
      title: "Status Tracking Test",
      body: "Testing delivery status transitions",
      url: "/test/status",
      createdById: userId1,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    await Effect.runPromise(executeProgram);

    // Verify delivery tracking
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);

    expect(deliveries.length).toBe(1);

    const delivery = deliveries[0];

    // Verify all tracking fields
    expect(delivery.id).toBeDefined();
    expect(delivery.notificationId).toBeDefined();
    expect(delivery.tripId).toBe(tripId);
    expect(delivery.status).toBe("success");
    expect(delivery.totalRecipients).toBe(2);
    expect(delivery.successCount).toBe(2);
    expect(delivery.failureCount).toBe(0);
    expect(delivery.deliveryStartedAt).toBeInstanceOf(Date);
    expect(delivery.deliveryCompletedAt).toBeInstanceOf(Date);
    expect(delivery.errors).toBeNull();

    // Verify timestamps make sense
    expect(delivery.deliveryCompletedAt.getTime()).toBeGreaterThanOrEqual(
      delivery.deliveryStartedAt.getTime()
    );

    // Cleanup
    unsubscribe();
  });

  it("should handle handler error isolation without affecting use case response", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-1`, userId: userId as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    // Don't seed any push subscriptions - this will trigger handler to complete with 0 recipients
    // but not fail

    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event)
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId,
      tripId,
      title: "Error Isolation Test",
      body: "Testing that handler errors don't break use case",
      url: "/test/isolation",
      createdById: userId,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));

    // Use case should complete successfully even though handler will have 0 subscriptions
    const result = await Effect.runPromise(executeProgram);

    expect(result.success).toBe(true);

    // Verify delivery was still tracked (handler handles no-subscriptions gracefully)
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);

    expect(deliveries.length).toBe(1);
    expect(deliveries[0].status).toBe("success");
    expect(deliveries[0].totalRecipients).toBe(0);
    expect(deliveries[0].successCount).toBe(0);
    expect(deliveries[0].failureCount).toBe(0);

    // Cleanup
    unsubscribe();
  });

  it("should verify event bus publishes to correct event type", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-1`, userId: userId as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    // Track received events
    const receivedEvents: unknown[] = [];

    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
    );

    // Subscribe handler that tracks events
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => {
          receivedEvents.push(event);
          return Effect.void;
        }
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId,
      tripId,
      title: "Event Verification Test",
      body: "Verifying correct event type is published",
      url: "/test/event",
      createdById: userId,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    await Effect.runPromise(executeProgram);

    // Verify event was received with correct type
    expect(receivedEvents.length).toBe(1);

    const receivedEvent = receivedEvents[0] as { _tag: string; aggregateId: string; title: string };
    expect(receivedEvent._tag).toBe("NotificationCreated");
    expect(receivedEvent.title).toBe("Event Verification Test");
    expect(receivedEvent.aggregateId).toBeDefined();

    // Cleanup
    unsubscribe();
  });
});
