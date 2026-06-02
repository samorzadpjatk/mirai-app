import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Database } from "bun:sqlite";
import { eq, and, inArray } from "drizzle-orm";
import {
  createNotificationsTestDb,
  seedNotification,
  seedNotificationPush,
  seedPushSubscription,
  seedUser,
  seedTripParticipant,
  seedGroup,
} from "./helpers/notifications-router-sqlite-db";
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
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: "test@example.com" } }, error: null }),
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
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com" }, error: null }),
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

// ── Raw SQLite transaction rollback ────────────────────────────────────

describe("notifications router — raw SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        url TEXT NOT NULL,
        created_by_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS notification_pushes (
        id TEXT PRIMARY KEY,
        notification_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        sent_at INTEGER,
        failure_reason TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back notification and pushes insert on failure", () => {
    const notifCountBefore = db
      .query("SELECT COUNT(*) as count FROM notifications")
      .get() as { count: number };
    expect(notifCountBefore.count).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO notifications (id, trip_id, title, body, url, created_by_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["notif-1", "trip-1", "Title", "Body", "/url", "user-1", Date.now(), Date.now()],
      );
      db.run(
        `INSERT INTO notification_pushes (id, notification_id, target_user_id, status) VALUES (?, ?, ?, ?)`,
        ["push-1", "notif-1", "user-1", "pending"],
      );
      db.run(
        `INSERT INTO notification_pushes (id, notification_id, target_user_id, status) VALUES (?, ?, ?, ?)`,
        ["push-2", "notif-1", "user-2", "pending"],
      );
      throw new Error("Simulated failure after notification creation");
    } catch {
      db.exec("ROLLBACK");
    }

    const notifCountAfter = db
      .query("SELECT COUNT(*) as count FROM notifications")
      .get() as { count: number };
    expect(notifCountAfter.count).toBe(0);

    const pushCountAfter = db
      .query("SELECT COUNT(*) as count FROM notification_pushes")
      .get() as { count: number };
    expect(pushCountAfter.count).toBe(0);
  });

  it("commits notification and pushes insert when no failure", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO notifications (id, trip_id, title, body, url, created_by_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["notif-1", "trip-1", "Title", "Body", "/url", "user-1", Date.now(), Date.now()],
    );
    db.run(
      `INSERT INTO notification_pushes (id, notification_id, target_user_id, status) VALUES (?, ?, ?, ?)`,
      ["push-1", "notif-1", "user-1", "pending"],
    );
    db.exec("COMMIT");

    const notifCountAfter = db
      .query("SELECT COUNT(*) as count FROM notifications")
      .get() as { count: number };
    expect(notifCountAfter.count).toBe(1);

    const pushCountAfter = db
      .query("SELECT COUNT(*) as count FROM notification_pushes")
      .get() as { count: number };
    expect(pushCountAfter.count).toBe(1);
  });

  it("rolls back subscription insert on failure", () => {
    const subCountBefore = db
      .query("SELECT COUNT(*) as count FROM push_subscriptions")
      .get() as { count: number };
    expect(subCountBefore.count).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO push_subscriptions (id, user_id, token, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        ["sub-1", "user-1", "token-abc", Date.now(), Date.now()],
      );
      throw new Error("Simulated failure after subscription insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const subCountAfter = db
      .query("SELECT COUNT(*) as count FROM push_subscriptions")
      .get() as { count: number };
    expect(subCountAfter.count).toBe(0);
  });
});

// ── Drizzle ORM SQLite integration ─────────────────────────────────────

describe("notifications router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createNotificationsTestDb>;

  beforeEach(() => {
    testDb = createNotificationsTestDb();
  });

  afterEach(() => {
    testDb.db.close();
  });

  function createCaller(ctx: TRPCContext) {
    return createRouterClient(notificationRouter, { context: ctx });
  }

  describe("subscribe", () => {
    it("inserts push subscription for authenticated user", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "expo-push-token-1" });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      const subs = await testDb.drizzleDb
        .select()
        .from(testDb.sqlitePushSubscriptions)
        .where(eq(testDb.sqlitePushSubscriptions.userId, "user-123"));
      expect(subs).toHaveLength(1);
      expect(subs[0].token).toBe("expo-push-token-1");
    });

    it("updates existing subscription timestamp on conflict", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-1",
        userId: "user-123",
        token: "expo-push-token-1",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "expo-push-token-1" });

      expect(result.success).toBe(true);

      const subs = await testDb.drizzleDb
        .select()
        .from(testDb.sqlitePushSubscriptions)
        .where(eq(testDb.sqlitePushSubscriptions.userId, "user-123"));
      expect(subs).toHaveLength(1);
      expect(subs[0].token).toBe("expo-push-token-1");
    });
  });

  describe("unsubscribe", () => {
    it("deletes subscription matching token and user", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-1",
        userId: "user-123",
        token: "token-abc",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribe({ token: "token-abc" });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);

      const subs = await testDb.drizzleDb
        .select()
        .from(testDb.sqlitePushSubscriptions);
      expect(subs).toHaveLength(0);
    });

    it("throws NOT_FOUND when subscription does not exist", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      await expect(caller.unsubscribe({ token: "non-existent" })).rejects.toThrow("No subscription found with that token");
    });
  });

  describe("unsubscribeAll", () => {
    it("deletes all subscriptions for the authenticated user", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-1",
        userId: "user-123",
        token: "token-a",
      });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-2",
        userId: "user-123",
        token: "token-b",
      });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-3",
        userId: "user-456",
        token: "token-c",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribeAll();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);

      const remaining = await testDb.drizzleDb
        .select()
        .from(testDb.sqlitePushSubscriptions);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].userId).toBe("user-456");
    });
  });

  describe("getSubscriptionStatus", () => {
    it("returns mapped status when user has subscriptions", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-1",
        userId: "user-123",
        token: "token-a",
      });
      await seedPushSubscription(testDb.drizzleDb, {
        id: "sub-2",
        userId: "user-123",
        token: "token-b",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions[0].token).toBeDefined();
      expect(result.subscriptions[0].id).toBeDefined();
    });

    it("returns not subscribed when no subscriptions exist", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptions).toHaveLength(0);
    });
  });

  describe("getAllMy", () => {
    it("returns notifications with pagination for the user", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedUser(testDb.drizzleDb, { id: "creator-1" });
      const notif = await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "creator-1",
        tripId: "trip-1",
      });
      await seedNotificationPush(testDb.drizzleDb, {
        id: "push-1",
        notificationId: notif.id,
        targetUserId: "user-123",
        status: "pending",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      const result = await caller.getAllMy({ page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("throws BAD_REQUEST when page exceeds total pages", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-123" });
      await seedUser(testDb.drizzleDb, { id: "creator-1" });
      const notif = await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "creator-1",
        tripId: "trip-1",
      });
      await seedNotificationPush(testDb.drizzleDb, {
        id: "push-1",
        notificationId: notif.id,
        targetUserId: "user-123",
        status: "pending",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB);
      const caller = createCaller(ctx);

      await expect(caller.getAllMy({ page: 10, pageSize: 10 })).rejects.toThrow("Page 10 exceeds total pages 1");
    });
  });

  describe("getAll", () => {
    it("returns all notifications with pagination for admin", async () => {
      await seedUser(testDb.drizzleDb, { id: "admin-123" });
      await seedUser(testDb.drizzleDb, { id: "creator-1" });
      await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "creator-1",
        tripId: "trip-1",
      });
      await seedNotification(testDb.drizzleDb, {
        id: "notif-2",
        createdById: "creator-1",
        tripId: "trip-1",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
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
      await seedUser(testDb.drizzleDb, { id: "admin-123" });
      await seedUser(testDb.drizzleDb, { id: "creator-1" });
      await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "creator-1",
        tripId: "trip-1",
      });
      await seedNotification(testDb.drizzleDb, {
        id: "notif-2",
        createdById: "creator-1",
        tripId: "trip-2",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
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
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });
      await seedUser(testDb.drizzleDb, { id: "user-1" });
      await seedUser(testDb.drizzleDb, { id: "user-2" });
      await seedGroup(testDb.drizzleDb, {
        id: "group-1",
        tripId: "trip-1",
        name: "Test Group",
        organizerId: "moderator-123",
        code: "GRP01",
      });
      await seedTripParticipant(testDb.drizzleDb, {
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        groupId: "group-1",
      });
      await seedTripParticipant(testDb.drizzleDb, {
        id: "tp-2",
        userId: "user-2",
        tripId: "trip-1",
        groupId: "group-1",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
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

      const notifs = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotifications)
        .where(eq(testDb.sqliteNotifications.id, result.notificationId));
      expect(notifs).toHaveLength(1);
      expect(notifs[0].title).toBe("Hello");

      const pushes = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotificationPushes)
        .where(eq(testDb.sqliteNotificationPushes.notificationId, result.notificationId));
      expect(pushes).toHaveLength(2);
    });

    it("throws NOT_FOUND when group belongs to different trip", async () => {
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });
      await seedGroup(testDb.drizzleDb, {
        id: "group-1",
        tripId: "trip-2",
        name: "Test Group",
        organizerId: "moderator-123",
        code: "GRP01",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
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
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });
      await seedUser(testDb.drizzleDb, { id: "user-1" });
      await seedGroup(testDb.drizzleDb, {
        id: "group-1",
        tripId: "trip-1",
        name: "Test Group",
        organizerId: "moderator-123",
        code: "GRP01",
      });
      await seedTripParticipant(testDb.drizzleDb, {
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        groupId: "group-1",
      });

      const notifId = "notif-tx-1";

      expect(() => {
        testDb.drizzleDb.transaction((tx) => {
          tx.insert(testDb.sqliteNotifications).values({
            id: notifId,
            tripId: "trip-1",
            title: "Tx Title",
            body: "Tx Body",
            url: "/tx",
            createdById: "moderator-123",
          });
          tx.insert(testDb.sqliteNotificationPushes).values({
            id: "push-tx-1",
            notificationId: notifId,
            targetUserId: "user-1",
            status: "pending",
          });
          throw new Error("Simulated push failure");
        });
      }).toThrow("Simulated push failure");

      const notifs = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotifications)
        .where(eq(testDb.sqliteNotifications.id, notifId));
      expect(notifs).toHaveLength(0);

      const pushes = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotificationPushes)
        .where(eq(testDb.sqliteNotificationPushes.notificationId, notifId));
      expect(pushes).toHaveLength(0);
    });
  });

  describe("retryNotification", () => {
    it("updates failed pushes to pending and returns retry result", async () => {
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });
      await seedUser(testDb.drizzleDb, { id: "user-1" });
      await seedUser(testDb.drizzleDb, { id: "user-2" });
      const notif = await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "moderator-123",
        tripId: "trip-1",
      });
      await seedNotificationPush(testDb.drizzleDb, {
        id: "push-1",
        notificationId: notif.id,
        targetUserId: "user-1",
        status: "failed",
        failureReason: "expo_error",
      });
      await seedNotificationPush(testDb.drizzleDb, {
        id: "push-2",
        notificationId: notif.id,
        targetUserId: "user-2",
        status: "failed",
        failureReason: "network_error",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      const result = await caller.retryNotification({ notificationId: "notif-1" });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe("notif-1");
      expect(result.retriedCount).toBe(2);

      const pushes = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotificationPushes)
        .where(eq(testDb.sqliteNotificationPushes.notificationId, "notif-1"));
      expect(pushes).toHaveLength(2);
      expect(pushes.every((p) => p.status === "pending")).toBe(true);
      expect(pushes.every((p) => p.failureReason === null)).toBe(true);
    });

    it("throws NOT_FOUND when notification does not exist", async () => {
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
        userId: "moderator-123",
        role: "MODERATOR",
      });
      const caller = createCaller(ctx);

      await expect(caller.retryNotification({ notificationId: "missing" })).rejects.toThrow(
        "Notification not found",
      );
    });

    it("throws BAD_REQUEST when no failed pushes exist", async () => {
      await seedUser(testDb.drizzleDb, { id: "moderator-123" });
      await seedUser(testDb.drizzleDb, { id: "user-1" });
      const notif = await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "moderator-123",
        tripId: "trip-1",
      });
      await seedNotificationPush(testDb.drizzleDb, {
        id: "push-1",
        notificationId: notif.id,
        targetUserId: "user-1",
        status: "sent",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
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
      await seedUser(testDb.drizzleDb, { id: "admin-123" });
      await seedNotification(testDb.drizzleDb, {
        id: "notif-1",
        createdById: "admin-123",
        tripId: "trip-1",
      });

      const ctx = createAuthContext(testDb.drizzleDb as unknown as DB, {
        userId: "admin-123",
        role: "ADMIN",
      });
      const caller = createCaller(ctx);

      const result = await caller.delete({ notificationId: "notif-1" });

      expect(result.success).toBe(true);

      const notifs = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotifications)
        .where(eq(testDb.sqliteNotifications.id, "notif-1"));
      expect(notifs).toHaveLength(0);
    });
  });

  describe("Drizzle ORM transaction rollback", () => {
    it("rolls back Drizzle ORM transaction on failure for notification operations", async () => {
      await seedUser(testDb.drizzleDb, { id: "user-1" });

      expect(() => {
        testDb.drizzleDb.transaction((tx) => {
          tx.insert(testDb.sqliteNotifications).values({
            id: "notif-tx",
            tripId: "trip-1",
            title: "Tx Title",
            body: "Tx Body",
            url: "/tx",
            createdById: "user-1",
          });
          tx.insert(testDb.sqliteNotificationPushes).values({
            id: "push-tx",
            notificationId: "notif-tx",
            targetUserId: "user-1",
            status: "pending",
          });
          throw new Error("Simulated failure");
        });
      }).toThrow("Simulated failure");

      const notifs = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotifications)
        .where(eq(testDb.sqliteNotifications.id, "notif-tx"));
      expect(notifs).toHaveLength(0);

      const pushes = await testDb.drizzleDb
        .select()
        .from(testDb.sqliteNotificationPushes)
        .where(eq(testDb.sqliteNotificationPushes.notificationId, "notif-tx"));
      expect(pushes).toHaveLength(0);
    });
  });
});
