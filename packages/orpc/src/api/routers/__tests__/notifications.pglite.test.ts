import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { eq, and } from "drizzle-orm";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import {
  notifications,
  notificationPushes,
  pushSubscriptions,
  users,
  tripParticipants,
  groups,
  trips,
} from "@mirai-app/db";
import { notificationRouter } from "../../routers/notifications";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { DB } from "@mirai-app/db";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "auth-123" },
    dbUser: {
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
  requireModerator: vi.fn().mockResolvedValue({
    id: "moderator-123",
    authUserId: "auth-123",
    firstName: "Test",
    lastName: "Moderator",
    role: "MODERATOR",
    hasAvatar: false,
    lastSeenOn: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-123",
    authUserId: "auth-123",
    firstName: "Test",
    lastName: "Admin",
    role: "ADMIN",
    hasAvatar: false,
    lastSeenOn: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

vi.mock("../../../services/notificationService", () => ({
  NotificationService: {
    createCoinsAddedNotification: vi.fn().mockReturnValue({
      title: "Coins added",
      body: "Your guild received coins!",
      url: "/group/my",
    }),
    createCoinsRemovedNotification: vi.fn().mockReturnValue({
      title: "Coins removed",
      body: "Your guild lost coins!",
      url: "/group/my",
    }),
    createNewMemberNotification: vi.fn().mockReturnValue({
      title: "New member",
      body: "Someone joined your guild!",
      url: "/group/my",
    }),
    createRankingUpdateNotification: vi.fn().mockReturnValue({
      title: "Ranking update",
      body: "Your guild moved up!",
      url: "/ranking",
    }),
  },
  sendMobileNotifications: vi.fn().mockResolvedValue({
    sent: 10,
    failed: 0,
    total: 10,
    success: true,
  }),
}));

function createMockSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
      getSession: vi.fn(),
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ data: { user: { email: "test@example.com" } }, error: null }),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({ data: { signedUrl: "https://example.com" }, error: null }),
      })),
    },
  };
}

function createAuthContext(
  db: DB,
  overrides: { userId?: string; role?: string; firstName?: string; lastName?: string } = {},
): TRPCContext {
  const userId = overrides.userId ?? "user-123";
  const role = overrides.role ?? "USER";
  return {
    db,
    supabase: createMockSupabase() as unknown as TRPCContext["supabase"],
    headers: new Headers({ Authorization: "Bearer test-token" }),
    accessToken: "test-token",
    user: { id: "auth-123" },
    dbUser: {
      id: userId,
      authUserId: "auth-123",
      firstName: overrides.firstName ?? "Test",
      lastName: overrides.lastName ?? "User",
      role,
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

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

// ── PGLite transaction rollback ────────────────────────────────────────

describe("notifications router — PGLite transaction rollback", () => {
  async function seedUser(id: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId: `auth-${id}`,
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async function seedTrip(id: string) {
    await testDb.db.insert(trips).values({
      id,
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  it("rolls back notification and pushes insert on failure", async () => {
    await seedUser("user-1");
    await seedUser("user-2");
    await seedTrip("trip-1");

    const notifCountBefore = await testDb.db.$count(notifications);
    expect(notifCountBefore).toBe(0);

    const notifId = "notif-tx-1";
    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(notifications).values({
          id: notifId,
          tripId: "trip-1",
          title: "Title",
          body: "Body",
          url: "/url",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await tx.insert(notificationPushes).values({
          notificationId: notifId,
          targetUserId: "user-1",
          status: "pending",
        });
        await tx.insert(notificationPushes).values({
          notificationId: notifId,
          targetUserId: "user-2",
          status: "pending",
        });
        throw new Error("Simulated failure after notification creation");
      });
    } catch {
      // transaction rolled back
    }

    const notifCountAfter = await testDb.db.$count(notifications);
    expect(notifCountAfter).toBe(0);

    const pushCountAfter = await testDb.db.$count(notificationPushes);
    expect(pushCountAfter).toBe(0);
  });

  it("commits notification and pushes insert when no failure", async () => {
    await seedUser("user-1");
    await seedTrip("trip-1");

    const notifId = "notif-tx-1";
    await testDb.db.transaction(async (tx) => {
      await tx.insert(notifications).values({
        id: notifId,
        tripId: "trip-1",
        title: "Title",
        body: "Body",
        url: "/url",
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await tx.insert(notificationPushes).values({
        notificationId: notifId,
        targetUserId: "user-1",
        status: "pending",
      });
    });

    const notifCountAfter = await testDb.db.$count(notifications);
    expect(notifCountAfter).toBe(1);

    const pushCountAfter = await testDb.db.$count(notificationPushes);
    expect(pushCountAfter).toBe(1);
  });

  it("rolls back subscription insert on failure", async () => {
    await seedUser("user-1");

    const subCountBefore = await testDb.db.$count(pushSubscriptions);
    expect(subCountBefore).toBe(0);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(pushSubscriptions).values({
          id: "sub-1",
          userId: "user-1",
          token: "token-abc",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        throw new Error("Simulated failure after subscription insert");
      });
    } catch {
      // transaction rolled back
    }

    const subCountAfter = await testDb.db.$count(pushSubscriptions);
    expect(subCountAfter).toBe(0);
  });
});

// ── Drizzle ORM PGLite integration ─────────────────────────────────────

describe("notifications router — Drizzle ORM PGLite integration", () => {
  function createCaller(ctx: TRPCContext) {
    return createRouterClient(notificationRouter, { context: ctx });
  }

  async function seedUser(id: string, authUserId?: string, firstName?: string, lastName?: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId: authUserId ?? `auth-${id}`,
      firstName: firstName ?? "Test",
      lastName: lastName ?? "User",
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTrip(id: string) {
    await testDb.db.insert(trips).values({
      id,
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    name: string,
    organizerId: string,
    code: string,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name,
      organizerId,
      code,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTripParticipant(id: string, userId: string, tripId: string, groupId?: string) {
    await testDb.db.insert(tripParticipants).values({
      id,
      userId,
      tripId,
      groupId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedNotification(id: string, createdById: string, tripId?: string) {
    const [result] = await testDb.db
      .insert(notifications)
      .values({
        id,
        tripId,
        title: "Test Notification",
        body: "Test body",
        url: "/test",
        createdById,
        createdAt: now(),
        updatedAt: now(),
      })
      .returning();
    return result;
  }

  async function seedNotificationPush(
    notificationId: string,
    targetUserId: string,
    status: string,
    failureReason?: string,
  ) {
    const [result] = await testDb.db
      .insert(notificationPushes)
      .values({
        notificationId,
        targetUserId,
        status,
        failureReason: failureReason ?? null,
      })
      .returning();
    return result;
  }

  async function seedPushSubscription(id: string, userId: string, token: string) {
    const [result] = await testDb.db
      .insert(pushSubscriptions)
      .values({
        id,
        userId,
        token,
        createdAt: now(),
        updatedAt: now(),
      })
      .returning();
    return result;
  }

  describe("subscribe", () => {
    it("inserts push subscription for authenticated user", async () => {
      await seedUser("user-123");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "expo-push-token-1" });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      const subs = await testDb.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, "user-123"));
      expect(subs).toHaveLength(1);
      expect(subs[0].token).toBe("expo-push-token-1");
    });

    it("updates existing subscription timestamp on conflict", async () => {
      await seedUser("user-123");
      await seedPushSubscription("sub-1", "user-123", "expo-push-token-1");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "expo-push-token-1" });

      expect(result.success).toBe(true);

      const subs = await testDb.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, "user-123"));
      expect(subs).toHaveLength(1);
      expect(subs[0].token).toBe("expo-push-token-1");
    });
  });

  describe("unsubscribe", () => {
    it("deletes subscription matching token and user", async () => {
      await seedUser("user-123");
      await seedPushSubscription("sub-1", "user-123", "token-abc");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribe({ token: "token-abc" });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);

      const subs = await testDb.db.select().from(pushSubscriptions);
      expect(subs).toHaveLength(0);
    });

    it("throws NOT_FOUND when subscription does not exist", async () => {
      await seedUser("user-123");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      await expect(caller.unsubscribe({ token: "non-existent" })).rejects.toThrow(
        "No subscription found with that token",
      );
    });
  });

  describe("unsubscribeAll", () => {
    it("deletes all subscriptions for the authenticated user", async () => {
      await seedUser("user-123");
      await seedUser("user-456");
      await seedPushSubscription("sub-1", "user-123", "token-a");
      await seedPushSubscription("sub-2", "user-123", "token-b");
      await seedPushSubscription("sub-3", "user-456", "token-c");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribeAll();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);

      const remaining = await testDb.db.select().from(pushSubscriptions);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].userId).toBe("user-456");
    });
  });

  describe("getSubscriptionStatus", () => {
    it("returns mapped status when user has subscriptions", async () => {
      await seedUser("user-123");
      await seedPushSubscription("sub-1", "user-123", "token-a");
      await seedPushSubscription("sub-2", "user-123", "token-b");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions[0].token).toBeDefined();
      expect(result.subscriptions[0].id).toBeDefined();
    });

    it("returns not subscribed when no subscriptions exist", async () => {
      await seedUser("user-123");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptions).toHaveLength(0);
    });
  });

  describe("getAllMy", () => {
    it("returns notifications with pagination for the user", async () => {
      await seedUser("user-123");
      await seedUser("creator-1");
      await seedTrip("trip-1");
      const notif = await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotificationPush(notif.id, "user-123", "pending");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      const result = await caller.getAllMy({ page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("throws BAD_REQUEST when page exceeds total pages", async () => {
      await seedUser("user-123");
      await seedUser("creator-1");
      await seedTrip("trip-1");
      const notif = await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotificationPush(notif.id, "user-123", "pending");

      const ctx = createAuthContext(testDb.db);
      const caller = createCaller(ctx);

      await expect(caller.getAllMy({ page: 10, pageSize: 10 })).rejects.toThrow(
        "Page 10 exceeds total pages 1",
      );
    });
  });

  describe("getAll", () => {
    it("returns all notifications with pagination for admin", async () => {
      await seedUser("admin-123");
      await seedUser("creator-1");
      await seedTrip("trip-1");
      await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotification("notif-2", "creator-1", "trip-1");

      const ctx = createAuthContext(testDb.db, {
        userId: "admin-123",
        role: "ADMIN",
      });
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        tripId: "trip-1",
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("filters notifications by tripId", async () => {
      await seedUser("admin-123");
      await seedUser("creator-1");
      await seedTrip("trip-1");
      await seedTrip("trip-2");
      await seedNotification("notif-1", "creator-1", "trip-1");
      await seedNotification("notif-2", "creator-1", "trip-2");

      const ctx = createAuthContext(testDb.db, {
        userId: "admin-123",
        role: "ADMIN",
      });
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-1" });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].id).toBe("notif-1");
    });
  });

  describe("sendToGroup", () => {
    it("inserts notification and pushes for group members", async () => {
      await seedUser("moderator-123");
      await seedUser("user-1");
      await seedUser("user-2");
      await seedTrip("trip-1");
      await seedGroup("group-1", "trip-1", "Test Group", "moderator-123", "GRP01");
      await seedTripParticipant("tp-1", "user-1", "trip-1", "group-1");
      await seedTripParticipant("tp-2", "user-2", "trip-1", "group-1");

      const ctx = createAuthContext(testDb.db, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      const result = await caller.sendToGroup({
        tripId: "trip-1",
        groupId: "group-1",
        title: "Hello",
        body: "World",
        url: "/test",
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();

      const notifs = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, result.notificationId));
      expect(notifs).toHaveLength(1);
      expect(notifs[0].title).toBe("Hello");

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, result.notificationId));
      expect(pushes).toHaveLength(2);
    });

    it("throws NOT_FOUND when group belongs to different trip", async () => {
      await seedUser("moderator-123");
      await seedTrip("trip-2");
      await seedGroup("group-1", "trip-2", "Test Group", "moderator-123", "GRP01");

      const ctx = createAuthContext(testDb.db, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      await expect(
        caller.sendToGroup({
          tripId: "trip-1",
          groupId: "group-1",
          title: "Hello",
          body: "World",
          url: "/test",
        }),
      ).rejects.toThrow("Group not found");
    });
  });

  describe("sendToGroup transaction rollback", () => {
    it("rolls back notification and pushes insert on failure via Drizzle transaction", async () => {
      await seedUser("moderator-123");
      await seedUser("user-1");
      await seedTrip("trip-1");
      await seedGroup("group-1", "trip-1", "Test Group", "moderator-123", "GRP01");
      await seedTripParticipant("tp-1", "user-1", "trip-1", "group-1");

      const notifId = "notif-tx-1";

      await expect(
        testDb.db.transaction(async (tx) => {
          await tx.insert(notifications).values({
            id: notifId,
            tripId: "trip-1",
            title: "Tx Title",
            body: "Tx Body",
            url: "/tx",
            createdById: "moderator-123",
            createdAt: now(),
            updatedAt: now(),
          });
          await tx.insert(notificationPushes).values({
            notificationId: notifId,
            targetUserId: "user-1",
            status: "pending",
          });
          throw new Error("Simulated push failure");
        }),
      ).rejects.toThrow("Simulated push failure");

      const notifs = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notifId));
      expect(notifs).toHaveLength(0);

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, notifId));
      expect(pushes).toHaveLength(0);
    });
  });

  describe("retryNotification", () => {
    it("updates failed pushes to pending and returns retry result", async () => {
      await seedUser("moderator-123");
      await seedUser("user-1");
      await seedUser("user-2");
      await seedTrip("trip-1");
      const notif = await seedNotification("notif-1", "moderator-123", "trip-1");
      await seedNotificationPush(notif.id, "user-1", "failed", "expo_error");
      await seedNotificationPush(notif.id, "user-2", "failed", "network_error");

      const ctx = createAuthContext(testDb.db, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      const result = await caller.retryNotification({ notificationId: "notif-1" });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe("notif-1");
      expect(result.retriedCount).toBe(2);

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, "notif-1"));
      expect(pushes).toHaveLength(2);
      expect(pushes.every((p) => p.status === "pending")).toBe(true);
      expect(pushes.every((p) => p.failureReason === null)).toBe(true);
    });

    it("throws NOT_FOUND when notification does not exist", async () => {
      await seedUser("moderator-123");

      const ctx = createAuthContext(testDb.db, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      await expect(caller.retryNotification({ notificationId: "missing" })).rejects.toThrow(
        "Notification not found",
      );
    });

    it("throws BAD_REQUEST when no failed pushes exist", async () => {
      await seedUser("moderator-123");
      await seedUser("user-1");
      await seedTrip("trip-1");
      const notif = await seedNotification("notif-1", "moderator-123", "trip-1");
      await seedNotificationPush(notif.id, "user-1", "sent");

      const ctx = createAuthContext(testDb.db, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      await expect(caller.retryNotification({ notificationId: "notif-1" })).rejects.toThrow(
        "No failed pushes to retry",
      );
    });
  });

  describe("deleteNotification", () => {
    it("deletes notification by id", async () => {
      await seedUser("admin-123");
      await seedTrip("trip-1");
      await seedNotification("notif-1", "admin-123", "trip-1");

      const ctx = createAuthContext(testDb.db, {
        userId: "admin-123",
        role: "ADMIN",
      });
      const caller = createCaller(ctx);

      const result = await caller.delete({ notificationId: "notif-1" });

      expect(result.success).toBe(true);

      const notifs = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, "notif-1"));
      expect(notifs).toHaveLength(0);
    });
  });

  describe("Drizzle ORM transaction rollback", () => {
    it("rolls back Drizzle ORM transaction on failure for notification operations", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1");

      await expect(
        testDb.db.transaction(async (tx) => {
          await tx.insert(notifications).values({
            id: "notif-tx",
            tripId: "trip-1",
            title: "Tx Title",
            body: "Tx Body",
            url: "/tx",
            createdById: "user-1",
            createdAt: now(),
            updatedAt: now(),
          });
          await tx.insert(notificationPushes).values({
            notificationId: "notif-tx",
            targetUserId: "user-1",
            status: "pending",
          });
          throw new Error("Simulated failure");
        }),
      ).rejects.toThrow("Simulated failure");

      const notifs = await testDb.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, "notif-tx"));
      expect(notifs).toHaveLength(0);

      const pushes = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, "notif-tx"));
      expect(pushes).toHaveLength(0);
    });
  });
});
