import {
  groups,
  notificationPushes,
  notifications,
  pushSubscriptions,
  tripParticipants,
} from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { seedGroup, seedParticipant, seedTrip, seedUser } from "../../test-helpers";
import * as notificationsModule from "../notifications";
import { sendNotification, sendRankingUpdate } from "../notifications";

const noop = (): void => undefined;

type RetryFunction<T> = () => Promise<T>;

// Mock the resilience module to simulate retry behavior without delays
vi.mock("../resilience", () => ({
  executeWithRetry: vi.fn(async <T>(fn: RetryFunction<T>): Promise<T> => {
    try {
      return await fn();
    } catch {
      return await fn();
    }
  }),
}));

describe("notifications — PGLite", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
    vi.clearAllMocks();
    const { executeWithRetry } = await import("../resilience");
    vi.mocked(executeWithRetry).mockImplementation(async <T>(fn: RetryFunction<T>): Promise<T> => {
      try {
        return await fn();
      } catch {
        return await fn();
      }
    });
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  vi.spyOn(console, "error").mockImplementation(noop);

  describe("sendNotification", () => {
    it("should create notification successfully", async () => {
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedUser(testDb.db, "user-3");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          userIds: ["user-2", "user-3"],
          tripId: "trip-1",
        },
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();

      const notif = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, result.notificationId));
      expect(notif).toHaveLength(1);
      expect(notif[0].title).toBe("Test Title");
      expect(notif[0].body).toBe("Test Body");
      expect(notif[0].url).toBe("/test");
      expect(notif[0].createdById).toBe("user-1");
      expect(notif[0].tripId).toBe("trip-1");
    });

    it("should deduplicate user IDs", async () => {
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2", "user-2", "user-2"],
          tripId: "trip-1",
        },
      });

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, result.notificationId));
      expect(pushes).toHaveLength(1);
      expect(pushes[0].targetUserId).toBe("user-2");
      expect(pushes[0].status).toBe("pending");
    });

    it("should create notification pushes for all users", async () => {
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedUser(testDb.db, "user-3");
      await seedUser(testDb.db, "user-4");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2", "user-3", "user-4"],
          tripId: "trip-1",
        },
      });

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, result.notificationId));
      expect(pushes).toHaveLength(3);
      const targetUserIds = pushes.map((p) => p.targetUserId).sort();
      expect(targetUserIds).toEqual(["user-2", "user-3", "user-4"]);
    });

    it("should handle empty userIds array", async () => {
      await seedUser(testDb.db, "user-1");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: [],
          tripId: "trip-1",
        },
      });

      expect(result.success).toBe(true);

      const pushCount = await testDb.db.$count(notificationPushes);
      expect(pushCount).toBe(0);
    });

    it("should handle null tripId", async () => {
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2"],
          tripId: null,
        },
      });

      const notif = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, result.notificationId));
      expect(notif).toHaveLength(1);
      expect(notif[0].tripId).toBeNull();
    });

    it("should throw ORPCError when notification creation fails", async () => {
      // Use a non-existent createdById to trigger a FK violation
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await expect(
        sendNotification({
          db: testDb.db,
          userId: "non-existent-creator",
          input: {
            title: "Test",
            body: "Body",
            url: "/test",
            userIds: ["user-2"],
            tripId: "trip-1",
          },
        }),
      ).rejects.toThrow(ORPCError);

      await expect(
        sendNotification({
          db: testDb.db,
          userId: "non-existent-creator",
          input: {
            title: "Test",
            body: "Body",
            url: "/test",
            userIds: ["user-2"],
            tripId: "trip-1",
          },
        }),
      ).rejects.toThrow("Failed to create notification");
    }, 30000);

    it("should retry on transient failures", async () => {
      const { executeWithRetry } = await import("../resilience");
      let wrappedAttempt = 0;

      // Temporarily override executeWithRetry to simulate a transient failure
      vi.mocked(executeWithRetry).mockImplementation(async (fn) => {
        const wrapped = async () => {
          wrappedAttempt++;
          if (wrappedAttempt === 1) {
            throw new Error("Transient error");
          }
          return await fn();
        };
        try {
          return await wrapped();
        } catch {
          return await wrapped();
        }
      });

      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendNotification({
        db: testDb.db,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2"],
          tripId: "trip-1",
        },
      });

      expect(result.success).toBe(true);
      expect(wrappedAttempt).toBe(2);
    });
  });

  describe("sendRankingUpdate", () => {
    it("should send notifications to all groups", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedUser(testDb.db, "user-3");
      await seedUser(testDb.db, "user-4");
      await seedUser(testDb.db, "user-5");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await testDb.db.insert(groups).values({
        id: "group-1",
        tripId: "trip-1",
        name: "Group A",
        description: "",
        organizerId: "admin-1",
        code: "GRP01",
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await testDb.db.insert(groups).values({
        id: "group-2",
        tripId: "trip-1",
        name: "Group B",
        description: "",
        organizerId: "admin-1",
        code: "GRP02",
        coins: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await testDb.db.insert(groups).values({
        id: "group-3",
        tripId: "trip-1",
        name: "Group C",
        description: "",
        organizerId: "admin-1",
        code: "GRP03",
        coins: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
      await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-1");
      await seedParticipant(testDb.db, "tp-3", "user-3", "trip-1", "group-2");
      await seedParticipant(testDb.db, "tp-4", "user-4", "trip-1", "group-3");
      await seedParticipant(testDb.db, "tp-5", "user-5", "trip-1", "group-3");

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toHaveLength(3);

      const notifCount = await testDb.db.$count(notifications);
      expect(notifCount).toBe(3);
    });

    it("should return empty success when no groups exist", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toEqual([]);
    });

    it("should include correct ranking position in notification", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await testDb.db.insert(groups).values({
        id: "group-1",
        tripId: "trip-1",
        name: "First Place",
        description: "",
        organizerId: "admin-1",
        code: "GRP01",
        coins: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await testDb.db.insert(groups).values({
        id: "group-2",
        tripId: "trip-1",
        name: "Second Place",
        description: "",
        organizerId: "admin-1",
        code: "GRP02",
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
      await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-2");

      await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      const notifs = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.tripId, "trip-1"))
        .orderBy(notifications.createdAt);

      expect(notifs).toHaveLength(2);
      expect(notifs[0].title).toContain("Ranking");
      expect(notifs[0].body).toContain("First Place");
    });

    it("should query participants for each group", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await testDb.db.insert(groups).values({
        id: "group-1",
        tripId: "trip-1",
        name: "Group A",
        description: "",
        organizerId: "admin-1",
        code: "GRP01",
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
      await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-1");

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.status, "pending"));
      expect(pushes).toHaveLength(2);
    });

    it("should handle groups with no participants", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await testDb.db.insert(groups).values({
        id: "group-1",
        tripId: "trip-1",
        name: "Group A",
        description: "",
        organizerId: "admin-1",
        code: "GRP01",
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);

      const pushCount = await testDb.db.$count(notificationPushes);
      expect(pushCount).toBe(0);
    });

    it("should return partial success when some notifications fail", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "user-2");
      await seedTrip(testDb.db, "trip-1", "Test Trip");

      await testDb.db.insert(groups).values({
        id: "group-1",
        tripId: "trip-1",
        name: "Group A",
        description: "",
        organizerId: "admin-1",
        code: "GRP01",
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await testDb.db.insert(groups).values({
        id: "group-2",
        tripId: "trip-1",
        name: "Group B",
        description: "",
        organizerId: "admin-1",
        code: "GRP02",
        coins: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
      await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-2");

      const { executeWithRetry } = await import("../resilience");
      let callCount = 0;
      vi.mocked(executeWithRetry).mockImplementation(async (fn) => {
        callCount++;
        if (callCount > 1) {
          throw new Error("Database error");
        }
        return await fn();
      });

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(false);
      expect(result.notificationIds).toHaveLength(1);
    }, 30000);

    it("dispatches the push instead of stopping at the notification row", async () => {
      await seedUser(testDb.db, "admin-1");
      await seedUser(testDb.db, "user-1");
      await seedUser(testDb.db, "bystander-1");
      await seedTrip(testDb.db, "trip-1", "Test Trip");
      await seedGroup(testDb.db, "group-1", "trip-1", "Group A", "admin-1", "GRP01");
      await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");

      // A subscription that belongs to nobody in the audience. Its only job is
      // to get past the "no subscriptions at all" short-circuit, so that
      // sendMobileNotifications reaches the point where it resolves the
      // audience and marks the undeliverable pushes.
      await testDb.db.insert(pushSubscriptions).values({
        id: "sub-1",
        userId: "bystander-1",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await sendRankingUpdate({
        db: testDb.db,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.notificationIds).toHaveLength(1);

      // Still "pending" would mean the push was never attempted — which is
      // exactly what used to happen: the row was created and nothing else.
      const pushes = await testDb.db.query.notificationPushes.findMany();
      expect(pushes).toHaveLength(1);
      expect(pushes[0]?.status).toBe("failed");
      expect(pushes[0]?.failureReason).toBe("no_valid_push_token");
    }, 30000);
  });
});
