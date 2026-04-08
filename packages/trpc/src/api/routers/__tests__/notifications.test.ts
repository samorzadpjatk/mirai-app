import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  pushSubscription: {
    upsert: mock(() => Promise.resolve({})),
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
    findMany: mock(() => Promise.resolve([])),
  },
  notification: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
    count: mock(() => Promise.resolve({ count: 0 })),
    delete: mock(() => Promise.resolve({})),
    create: mock(() => Promise.resolve({ id: "notif-new" })),
  },
  notificationPush: {
    findMany: mock(() => Promise.resolve([])),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
    createMany: mock(() => Promise.resolve({ count: 0 })),
  },
  group: {
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
  },
  tripParticipant: {
    findMany: mock(() => Promise.resolve([])),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
  };
};

describe("notification router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
  };

  const setupAdminMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
  };

  const setupModeratorMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Mod",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Mod",
      lastName: "User",
      role: "MODERATOR",
    });
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("subscribe", () => {
    test("creates push subscription", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.upsert.mockResolvedValueOnce({
        id: "sub-1",
        token: "device-token",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.subscribe({
        token: "device-token",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe("sub-1");
    });

    test("throws error when subscription fails", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.upsert.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.subscribe({ token: "device-token" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("unsubscribe", () => {
    test("removes push subscription", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.deleteMany.mockResolvedValueOnce({
        count: 1,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.unsubscribe({
        token: "device-token",
      });
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });

    test("throws NOT_FOUND when no subscription found", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.deleteMany.mockResolvedValueOnce({
        count: 0,
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.unsubscribe({ token: "invalid-token" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("unsubscribeAll", () => {
    test("removes all push subscriptions", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.deleteMany.mockResolvedValueOnce({
        count: 3,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.unsubscribeAll();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
    });
  });

  describe("getSubscriptionStatus", () => {
    test("returns subscription status when subscribed", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.findMany.mockResolvedValueOnce([
        { id: "sub-1", token: "token-1" },
        { id: "sub-2", token: "token-2" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.getSubscriptionStatus();
      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
    });

    test("returns not subscribed when no subscriptions", async () => {
      setupUserMocks();
      mockCtx.db.pushSubscription.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.getSubscriptionStatus();
      expect(result.isSubscribed).toBe(false);
    });
  });

  describe("getAllMy", () => {
    test("returns paginated notifications", async () => {
      setupUserMocks();
      mockCtx.db.notification.count.mockResolvedValueOnce(10);
      mockCtx.db.notification.findMany.mockResolvedValueOnce([
        {
          id: "notif-1",
          title: "Test",
          createdBy: { id: "user-2", firstName: "Jane" },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.getAllMy({
        page: 1,
        pageSize: 5,
      });
      expect(result.notifications).toHaveLength(1);
      expect(result.pagination.total).toBe(10);
    });

    test("throws BAD_REQUEST when page exceeds total", async () => {
      setupUserMocks();
      mockCtx.db.notification.count.mockResolvedValueOnce(10);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.getAllMy({ page: 5, pageSize: 5 }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("sendToGroup", () => {
    test("sends notification to group members", async () => {
      setupModeratorMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { userId: "user-1" },
        { userId: "user-2" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.sendToGroup({
        tripId: "trip-1",
        groupId: "group-1",
        title: "Hello",
        body: "World",
        url: "/home",
      });
      expect(result.success).toBe(true);
    });

    test("throws NOT_FOUND when group not found", async () => {
      setupModeratorMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.sendToGroup({
          tripId: "trip-1",
          groupId: "nonexistent",
          title: "Hello",
          body: "World",
          url: "/home",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("sendToAll", () => {
    test("sends notification to all participants", async () => {
      setupModeratorMocks();
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { userId: "user-1" },
        { userId: "user-2" },
        { userId: "user-3" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.sendToAll({
        tripId: "trip-1",
        title: "Announcement",
        body: "Important message",
        url: "/announcement",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("retryNotification", () => {
    test("retries failed notification", async () => {
      setupModeratorMocks();
      mockCtx.db.notification.findFirst.mockResolvedValueOnce({
        id: "notif-1",
        tripId: null,
        title: "Test",
        body: "Body",
        url: "/test",
      });
      mockCtx.db.notification.findUnique.mockResolvedValueOnce({
        id: "notif-1",
        tripId: null,
        title: "Test",
        body: "Body",
        url: "/test",
      });
      mockCtx.db.notificationPush.findMany
        .mockResolvedValueOnce([
          { id: "push-1", status: "failed", targetUserId: "user-1" },
        ])
        .mockResolvedValueOnce([]);
      mockCtx.db.notificationPush.updateMany.mockResolvedValueOnce({
        count: 1,
      });
      mockCtx.db.pushSubscription.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.retryNotification({
        notificationId: "notif-1",
      });
      expect(result.success).toBe(true);
      expect(result.retriedCount).toBe(1);
    });

    test("throws NOT_FOUND when notification not found", async () => {
      setupModeratorMocks();
      mockCtx.db.notification.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.retryNotification({
          notificationId: "nonexistent",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when no failed pushes", async () => {
      setupModeratorMocks();
      mockCtx.db.notification.findFirst.mockResolvedValueOnce({
        id: "notif-1",
        tripId: null,
        title: "Test",
        body: "Body",
        url: "/test",
      });
      mockCtx.db.notificationPush.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notifications.retryNotification({ notificationId: "notif-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("admin can delete notification", async () => {
      setupAdminMocks();
      mockCtx.db.notification.delete.mockResolvedValueOnce({ id: "notif-1" });
      const caller = createCaller(mockCtx);
      const result = await caller.notifications.delete({
        notificationId: "notif-1",
      });
      expect(result.success).toBe(true);
    });
  });
});
