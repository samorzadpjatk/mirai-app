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
import { AuthZPortTag } from "../../../auth/ports/AuthZPort";
import { AuthContextTag, type AuthContext } from "@mirai-app/adapters/infrastructure/effect";
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
  TripParticipant,
  PushSubscription,
  IDomainEvent,
  IAuthZPort,
} from "@mirai-app/domain";
import {
  GroupId,
  TripId,
  UserId,
  NotificationId,
  TripParticipantId,
  NotificationCreated,
} from "@mirai-app/domain";
import type { IPortError } from "@mirai-app/domain";

// Type for the use case result after dependencies are provided
type NotificationResult = { id: NotificationId; success: boolean; recipientCount: number };
type ProvidedEffect = Effect.Effect<NotificationResult, IPortError, never>;

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

const createMockGroup = (id: string, tripId: string, isDeleted = false): Group => {
  const mockGroup = {
    id: GroupId.unsafeCreate(id),
    tripId: TripId.unsafeCreate(tripId),
    name: `Group ${id}`,
    description: "Test group",
    image: null,
    organizerId: UserId.unsafeCreate("user-organizer"),
    code: `CODE${id.slice(-4)}`,
    coins: 0,
    isDeleted,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Group;
  return mockGroup;
};

const createMockGroupPort = (groups: Group[]): IGroupPort => ({
  findById: (id) => {
    const group = groups.find((g) => GroupId.toString(g.id) === GroupId.toString(id));
    return Effect.succeed(group ?? null);
  },
  findByTripId: (tripId) =>
    Effect.succeed(groups.filter((g) => TripId.toString(g.tripId) === TripId.toString(tripId))),
  findByTripIdPaginated: (tripId, params) =>
    Effect.succeed({
      groups: groups.filter((g) => TripId.toString(g.tripId) === TripId.toString(tripId)),
      total: groups.length,
      hasMore: false,
    }),
  findByCode: () => Effect.succeed(null),
  findByOrganizerId: () => Effect.succeed([]),
  create: (group) => Effect.succeed(group),
  update: (group) => Effect.succeed(group),
  delete: () => Effect.succeed(undefined),
  softDelete: () => Effect.succeed(undefined),
  exists: () => Effect.succeed(false),
  countByTripId: () => Effect.succeed(groups.length),
  addCoins: (groupId, _amount) => {
    const group = groups.find((g) => GroupId.toString(g.id) === GroupId.toString(groupId));
    return Effect.succeed(group ?? groups[0]) as Effect.Effect<Group, IPortError, never>;
  },
  subtractCoins: (groupId, _amount) => {
    const group = groups.find((g) => GroupId.toString(g.id) === GroupId.toString(groupId));
    return Effect.succeed(group ?? groups[0]) as Effect.Effect<Group, IPortError, never>;
  },
  getRanking: () => Effect.succeed(groups),
});

const createMockParticipantPort = (
  participants: Array<{ id: string; userId: UserId; tripId: TripId; groupId: GroupId | null }>,
): ITripParticipantPort => ({
  findById: () => Effect.succeed(null),
  findByTripId: () =>
    Effect.succeed(
      participants.map((p) => ({
        id: TripParticipantId.unsafeCreate(p.id),
        userId: p.userId,
        tripId: p.tripId,
        groupId: p.groupId,
        wristNumber: null,
        houseNumber: null,
        role: "MEMBER" as const,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        isLeader: () => false,
        assignToGroup: (groupId: GroupId) => ({ ...p, groupId } as TripParticipant),
        removeFromGroup: () => ({ ...p, groupId: null } as TripParticipant),
        promoteToLeader: () => ({ ...p, role: "LEADER" } as TripParticipant),
        demoteToMember: () => ({ ...p, role: "MEMBER" } as TripParticipant),
        withWristNumber: () => Effect.succeed({} as TripParticipant),
        withHouseNumber: () => Effect.succeed({} as TripParticipant),
      } as TripParticipant)),
    ),
  findByUserId: () =>
    Effect.succeed(
      participants.map((p) => ({
        id: TripParticipantId.unsafeCreate(p.id),
        userId: p.userId,
        tripId: p.tripId,
        groupId: p.groupId,
        wristNumber: null,
        houseNumber: null,
        role: "MEMBER" as const,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        isLeader: () => false,
        assignToGroup: (groupId: GroupId) => ({ ...p, groupId } as TripParticipant),
        removeFromGroup: () => ({ ...p, groupId: null } as TripParticipant),
        promoteToLeader: () => ({ ...p, role: "LEADER" } as TripParticipant),
        demoteToMember: () => ({ ...p, role: "MEMBER" } as TripParticipant),
        withWristNumber: () => Effect.succeed({} as TripParticipant),
        withHouseNumber: () => Effect.succeed({} as TripParticipant),
      } as TripParticipant)),
    ),
  findByUserAndTrip: () => Effect.succeed(null),
  upsert: (p) => Effect.succeed(p as TripParticipant),
  update: (p) => Effect.succeed(p as TripParticipant),
  delete: () => Effect.succeed(undefined),
  countByTripId: () => Effect.succeed(participants.length),
  isParticipant: () => Effect.succeed(true),
  findByWristNumber: () => Effect.succeed(null),
  findByUserAndTripWithRelations: () => Effect.succeed(null),
  findByTripIdWithRelations: () => Effect.succeed([]),
  create: (p) => Effect.succeed(p as TripParticipant),
  deleteByUserAndTrip: () => Effect.succeed(undefined),
  countByUserId: () => Effect.succeed(0),
});

const createMockNotificationServicePort = (): INotificationServicePort => ({
  sendNotification: () =>
    Effect.succeed({
      success: true,
      notificationId: NotificationId.unsafeCreate(`notif-${crypto.randomUUID()}`),
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
      notificationId: NotificationId.unsafeCreate(`notif-${crypto.randomUUID()}`),
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

const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(undefined),
  checkRolePermission: () => Effect.succeed(true),
});

const createMockAuthContext = (userId: string): AuthContext => ({
  userId,
  role: "ADMIN",
  tripRoles: {},
  isAuthenticated: true,
  accessToken: "mock-token",
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
    // Setup test data using branded ID factories
    const tripId = TripId.generate();
    const groupId = GroupId.generate();
    const userId1 = UserId.generate();
    const userId2 = UserId.generate();

    const mockGroup = createMockGroup(GroupId.toString(groupId), TripId.toString(tripId));
    const mockParticipants = [
      { id: `part-1`, userId: userId1, tripId: tripId, groupId: groupId },
      { id: `part-2`, userId: userId2, tripId: tripId, groupId: groupId },
    ];

    // Seed push subscriptions for the handler
    const mockSubscriptions: PushSubscription[] = [
      {
        id: `sub-${UserId.toString(userId1)}` as PushSubscription["id"],
        userId: userId1 as PushSubscription["userId"],
        token: `expo-token-${UserId.toString(userId1)}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: `sub-${UserId.toString(userId2)}` as PushSubscription["id"],
        userId: userId2 as PushSubscription["userId"],
        token: `expo-token-${UserId.toString(userId2)}`,
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
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
      Layer.succeed(AuthContextTag, createMockAuthContext(UserId.toString(userId1))),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event as Parameters<typeof handler.handle>[0])
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Measure response time
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId: groupId,
      tripId: tripId,
      title: "Performance Test Notification",
      body: "Testing response time",
      url: "/test/perf",
      createdById: userId1,
    };

    const startTime = performance.now();
    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    const result = await Effect.runPromise(executeProgram as ProvidedEffect);
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
    const tripId = TripId.generate();
    const groupId = GroupId.generate();
    const userId1 = UserId.generate();
    const userId2 = UserId.generate();

    const mockGroup = createMockGroup(GroupId.toString(groupId), TripId.toString(tripId));
    const mockParticipants = [
      { id: `part-1`, userId: userId1, tripId: tripId, groupId: groupId },
      { id: `part-2`, userId: userId2, tripId: tripId, groupId: groupId },
    ];

    // Seed push subscriptions
    const mockSubscriptions: PushSubscription[] = [
      {
        id: `sub-${UserId.toString(userId1)}` as PushSubscription["id"],
        userId: userId1 as PushSubscription["userId"],
        token: `expo-token-${UserId.toString(userId1)}`,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: `sub-${UserId.toString(userId2)}` as PushSubscription["id"],
        userId: userId2 as PushSubscription["userId"],
        token: `expo-token-${UserId.toString(userId2)}`,
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
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
      Layer.succeed(AuthContextTag, createMockAuthContext(UserId.toString(userId1))),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event as Parameters<typeof handler.handle>[0])
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId: groupId,
      tripId: tripId,
      title: "Status Tracking Test",
      body: "Testing delivery status transitions",
      url: "/test/status",
      createdById: userId1,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    await Effect.runPromise(executeProgram as ProvidedEffect);

    // Verify delivery tracking
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);

    expect(deliveries.length).toBe(1);

    const delivery = deliveries[0];
    if (delivery) {
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
      if (delivery.deliveryCompletedAt && delivery.deliveryStartedAt) {
        expect(delivery.deliveryCompletedAt.getTime()).toBeGreaterThanOrEqual(
          delivery.deliveryStartedAt.getTime()
        );
      }
    }

    // Cleanup
    unsubscribe();
  });

  it("should handle handler error isolation without affecting use case response", async () => {
    const tripId = TripId.generate();
    const groupId = GroupId.generate();
    const userId = UserId.generate();

    const mockGroup = createMockGroup(GroupId.toString(groupId), TripId.toString(tripId));
    const mockParticipants = [
      { id: `part-1`, userId: userId, tripId: tripId, groupId: groupId },
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
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
      Layer.succeed(AuthContextTag, createMockAuthContext(UserId.toString(userId))),
    );

    // Subscribe handler
    const subscribeProgram = Effect.gen(function* () {
      const { unsubscribe } = yield* eventBus.subscribe(
        "NotificationCreated",
        (event) => handler.handle(event as Parameters<typeof handler.handle>[0])
      );
      return unsubscribe;
    }).pipe(Effect.provide(testLayer));

    const unsubscribe = await Effect.runPromise(subscribeProgram);

    // Execute use case
    const useCase = new SendNotificationToGroupUseCase();
    const input = {
      groupId: groupId,
      tripId: tripId,
      title: "Error Isolation Test",
      body: "Testing that handler errors don't break use case",
      url: "/test/isolation",
      createdById: userId,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));

    // Use case should complete successfully even though handler will have 0 subscriptions
    const result = await Effect.runPromise(executeProgram as ProvidedEffect);

    expect(result.success).toBe(true);

    // Verify delivery was still tracked (handler handles no-subscriptions gracefully)
    const findDeliveryProgram = Effect.gen(function* () {
      const deliveries = yield* deliveryGateway.findAll({ limit: 10, offset: 0 });
      return deliveries.deliveries;
    }).pipe(Effect.provide(testLayer));

    const deliveries = await Effect.runPromise(findDeliveryProgram);

    expect(deliveries.length).toBe(1);
    const delivery = deliveries[0];
    if (delivery) {
      expect(delivery.status).toBe("success");
      expect(delivery.totalRecipients).toBe(0);
      expect(delivery.successCount).toBe(0);
      expect(delivery.failureCount).toBe(0);
    }

    // Cleanup
    unsubscribe();
  });

  it("should verify event bus publishes to correct event type", async () => {
    const tripId = TripId.generate();
    const groupId = GroupId.generate();
    const userId = UserId.generate();

    const mockGroup = createMockGroup(GroupId.toString(groupId), TripId.toString(tripId));
    const mockParticipants = [
      { id: `part-1`, userId: userId, tripId: tripId, groupId: groupId },
    ];

    // Track received events
    const receivedEvents: IDomainEvent[] = [];

    const testLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, eventBus),
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
      Layer.succeed(NotificationDeliveryPortTag, deliveryGateway),
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
      Layer.succeed(AuthContextTag, createMockAuthContext(UserId.toString(userId))),
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
      groupId: groupId,
      tripId: tripId,
      title: "Event Verification Test",
      body: "Verifying correct event type is published",
      url: "/test/event",
      createdById: userId,
    };

    const executeProgram = useCase.execute(input).pipe(Effect.provide(testLayer));
    await Effect.runPromise(executeProgram as ProvidedEffect);

    // Verify event was received with correct type
    expect(receivedEvents.length).toBe(1);

    const receivedEvent = receivedEvents[0] as NotificationCreated;
    if (receivedEvent) {
      expect(receivedEvent._tag).toBe("NotificationCreated");
      expect(receivedEvent.title).toBe("Event Verification Test");
      expect(receivedEvent.aggregateId).toBeDefined();
    }

    // Cleanup
    unsubscribe();
  });
});
