import { notificationPushes, notifications, pushSubscriptions, trips, users } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createContext } from "../../../../test-helpers";
import { getAll, getAllMy, getSubscriptionStatus, getUnreadCount } from "../queries";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedUser(id: string) {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "Test",
    lastName: "User",
    role: "USER",
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedNotification(id: string, createdById: string, tripId?: string) {
  await testDb.db.insert(notifications).values({
    id,
    tripId,
    title: "Test Notification",
    body: "Test body",
    url: "/test",
    createdById,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedNotificationPush(notificationId: string, targetUserId: string, status: string) {
  await testDb.db.insert(notificationPushes).values({
    notificationId,
    targetUserId,
    status,
  });
}

async function seedPushSubscription(userId: string, token: string) {
  await testDb.db.insert(pushSubscriptions).values({
    userId,
    token,
    createdAt: now(),
    updatedAt: now(),
  });
}

describe("notifications queries", () => {
  describe("getAllMy", () => {
    it("returns empty notifications when user has no pushes", async () => {
      await seedUser("user-1");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getAllMy(ctx, { page: 1, pageSize: 10 });

      expect(result.notifications).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("returns notifications with pagination for the user", async () => {
      await seedUser("user-1");
      await seedUser("creator-1");
      await seedTrip("trip-1", "Test Trip");
      await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotificationPush("notif-1", "user-1", "pending");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getAllMy(ctx, { page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("throws BAD_REQUEST when page exceeds total pages", async () => {
      await seedUser("user-1");
      await seedUser("creator-1");
      await seedTrip("trip-1", "Test Trip");
      await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotificationPush("notif-1", "user-1", "pending");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      await expect(getAllMy(ctx, { page: 2, pageSize: 10 })).rejects.toThrow(ORPCError);
      await expect(getAllMy(ctx, { page: 2, pageSize: 10 })).rejects.toThrow(
        "Page 2 exceeds total pages 1",
      );
    });
  });

  describe("getSubscriptionStatus", () => {
    it("returns isSubscribed false when user has no subscriptions", async () => {
      await seedUser("user-1");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getSubscriptionStatus(ctx);

      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptions).toEqual([]);
    });

    it("returns isSubscribed true with subscriptions when user has subscriptions", async () => {
      await seedUser("user-1");
      await seedPushSubscription("user-1", "token-a");
      await seedPushSubscription("user-1", "token-b");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getSubscriptionStatus(ctx);

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions.map((s) => s.token).sort()).toEqual(["token-a", "token-b"]);
    });
  });

  describe("getAll", () => {
    it("returns all notifications when no tripId filter is provided", async () => {
      await seedUser("admin-1");
      await seedTrip("trip-1", "Test Trip");
      await seedTrip("trip-2", "Other Trip");
      await seedNotification("notif-1", "admin-1", "trip-1");
      await seedNotification("notif-2", "admin-1", "trip-2");

      const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });

      const result = await getAll(ctx);

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("filters notifications by tripId when provided", async () => {
      await seedUser("admin-1");
      await seedTrip("trip-1", "Test Trip");
      await seedTrip("trip-2", "Other Trip");
      await seedNotification("notif-1", "admin-1", "trip-1");
      await seedNotification("notif-2", "admin-1", "trip-2");

      const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });

      const result = await getAll(ctx, { tripId: "trip-1" });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].id).toBe("notif-1");
    });

    it("uses default limit and offset when pagination not provided", async () => {
      await seedUser("admin-1");
      await seedTrip("trip-1", "Test Trip");
      await seedNotification("notif-1", "admin-1", "trip-1");

      const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });

      const result = await getAll(ctx, { tripId: "trip-1" });

      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("returns 0 when user has no pushes", async () => {
      await seedUser("user-1");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getUnreadCount(ctx);

      expect(result.unreadCount).toBe(0);
    });

    it("returns count of pending pushes only", async () => {
      await seedUser("user-1");
      await seedUser("creator-1");
      await seedTrip("trip-1", "Test Trip");
      await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotification("notif-2", "creator-1", "trip-1");
      await seedNotificationPush("notif-1", "user-1", "pending");
      await seedNotificationPush("notif-2", "user-1", "sent");

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await getUnreadCount(ctx);

      expect(result.unreadCount).toBe(1);
    });
  });
});
