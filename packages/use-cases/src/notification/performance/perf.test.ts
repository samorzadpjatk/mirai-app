import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { SendNotificationToGroupUseCase } from "../interactors/SendNotificationToGroup";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { NotificationServicePortTag } from "../ports/NotificationPort";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { InProcessEventBusGateway } from "@mirai-app/adapters";
import type {
  IGroupPort,
  ITripParticipantPort,
  INotificationServicePort,
  Group,
  TripId,
  GroupId,
  UserId,
  NotificationId,
} from "@mirai-app/domain";

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
      recipientCount: 5,
    }),
  sendMobileNotifications: () =>
    Effect.succeed({
      success: true,
      sent: 5,
      failed: 0,
      total: 5,
    }),
  sendRankingUpdate: () =>
    Effect.succeed({
      success: true,
      notificationId: `notif-${crypto.randomUUID()}` as NotificationId,
      recipientCount: 5,
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

const calculateStats = (times: number[]) => {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  const p50 = sorted[Math.floor(n * 0.5)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const p99 = sorted[Math.floor(n * 0.99)];
  const variance = sorted.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    p50: Math.round(p50 * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    p99: Math.round(p99 * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    count: n,
  };
};

const createHistogram = (times: number[]) => {
  const buckets = [
    { label: "0-1ms", min: 0, max: 1 },
    { label: "1-5ms", min: 1, max: 5 },
    { label: "5-10ms", min: 5, max: 10 },
    { label: "10-20ms", min: 10, max: 20 },
    { label: "20-50ms", min: 20, max: 50 },
    { label: "50-100ms", min: 50, max: 100 },
    { label: "100ms+", min: 100, max: Infinity },
  ];

  return buckets.map((bucket) => ({
    ...bucket,
    count: times.filter((t) => t >= bucket.min && t < bucket.max).length,
  }));
};

describe("[PERF] SendNotificationToGroup Performance", () => {
  it("should complete 100 concurrent requests with p95 < 100ms", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-${userId}`, userId: userId as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-2`, userId: `user-2` as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-3`, userId: `user-3` as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-4`, userId: `user-4` as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-5`, userId: `user-5` as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    const mockLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, new InProcessEventBusGateway()),
    );

    const useCase = new SendNotificationToGroupUseCase();

    for (let i = 0; i < 10; i++) {
      const warmupProgram = useCase.execute({
        groupId,
        tripId,
        title: "Warmup Notification",
        body: "This is a warmup request",
        url: "/test",
        createdById: userId,
      }).pipe(Effect.provide(mockLayer));
      await Effect.runPromise(warmupProgram);
    }

    const times: number[] = [];
    const errors: Error[] = [];

    const requests = Array(100).fill(null).map(async (_, index) => {
      const start = performance.now();
      try {
        const program = useCase.execute({
          groupId,
          tripId,
          title: `Performance Test ${index}`,
          body: "This is a performance test notification",
          url: "/test",
          createdById: userId,
        }).pipe(Effect.provide(mockLayer));
        await Effect.runPromise(program);
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        errors.push(error as Error);
        const end = performance.now();
        times.push(end - start);
      }
    });

    await Promise.all(requests);

    const stats = calculateStats(times);
    const histogram = createHistogram(times);

    console.log("\n=== Performance Test Results ===");
    console.log(`Total requests: ${stats.count}`);
    console.log(`Errors: ${errors.length}`);
    console.log("\n--- Latency Statistics (ms) ---");
    console.log(`Min:    ${stats.min.toFixed(2)}ms`);
    console.log(`Avg:    ${stats.avg.toFixed(2)}ms`);
    console.log(`P50:    ${stats.p50.toFixed(2)}ms`);
    console.log(`P95:    ${stats.p95.toFixed(2)}ms`);
    console.log(`P99:    ${stats.p99.toFixed(2)}ms`);
    console.log(`Max:    ${stats.max.toFixed(2)}ms`);
    console.log(`StdDev: ${stats.stdDev.toFixed(2)}ms`);
    console.log("\n--- Latency Distribution ---");
    histogram.forEach((bucket) => {
      const percentage = ((bucket.count / stats.count) * 100).toFixed(1);
      const bar = "=".repeat(Math.round((bucket.count / stats.count) * 40));
      console.log(`${bucket.label.padEnd(10)} | ${bar} ${bucket.count} (${percentage}%)`);
    });
    console.log("\n=== Target: p95 < 100ms ===");

    expect(errors.length).toBe(0);
    expect(stats.count).toBe(100);
    expect(stats.p95).toBeLessThan(100);
  });

  it("should show consistent performance across multiple test runs", async () => {
    const tripId = `trip-${crypto.randomUUID()}`;
    const groupId = `group-${crypto.randomUUID()}`;
    const userId = `user-${crypto.randomUUID()}`;

    const mockGroup = createMockGroup(groupId, tripId);
    const mockParticipants = [
      { id: `part-${userId}`, userId: userId as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
      { id: `part-2`, userId: `user-2` as UserId, tripId: tripId as TripId, groupId: groupId as GroupId },
    ];

    const mockLayer = Layer.mergeAll(
      Layer.succeed(GroupPortTag, createMockGroupPort([mockGroup])),
      Layer.succeed(TripParticipantPortTag, createMockParticipantPort(mockParticipants)),
      Layer.succeed(NotificationServicePortTag, createMockNotificationServicePort()),
      Layer.succeed(EventBusTag, new InProcessEventBusGateway()),
    );

    const useCase = new SendNotificationToGroupUseCase();
    const iterations = 3;
    const requestsPerIteration = 50;
    const allStats: Array<ReturnType<typeof calculateStats>> = [];

    for (let iteration = 0; iteration < iterations; iteration++) {
      const times: number[] = [];
      const requests = Array(requestsPerIteration).fill(null).map(async () => {
        const start = performance.now();
        const program = useCase.execute({
          groupId,
          tripId,
          title: "Consistency Test",
          body: "Testing performance consistency",
          url: "/test",
          createdById: userId,
        }).pipe(Effect.provide(mockLayer));
        await Effect.runPromise(program);
        const end = performance.now();
        times.push(end - start);
      });
      await Promise.all(requests);
      allStats.push(calculateStats(times));
    }

    console.log("\n=== Consistency Test Results ===");
    console.log(`Iterations: ${iterations}`);
    console.log(`Requests per iteration: ${requestsPerIteration}`);
    console.log("\n--- p95 Across Iterations ---");
    allStats.forEach((stats, i) => {
      console.log(`  Run ${i + 1}: ${stats.p95.toFixed(2)}ms`);
    });

    const p95Values = allStats.map((s) => s.p95);
    const p95Avg = p95Values.reduce((a, b) => a + b, 0) / p95Values.length;
    const p95Variance = p95Values.reduce((sum, v) => sum + Math.pow(v - p95Avg, 2), 0) / p95Values.length;
    const p95StdDev = Math.sqrt(p95Variance);

    console.log(`\nP95 StdDev: ${p95StdDev.toFixed(2)}ms`);
    console.log("=== Target: p95 < 100ms for all runs ===");

    allStats.forEach((stats) => {
      expect(stats.p95).toBeLessThan(100);
    });
  });
});
