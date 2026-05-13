import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { notificationRouter } from "../../routers/notifications";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, PushSubscription, Notification, NotificationPush, Group, TripParticipant } from "@mirai-app/db";
import { notifications, notificationPushes, pushSubscriptions, tripParticipants } from "@mirai-app/db";

// Mock the notification utilities
vi.mock("../../../utils/notifications", () => ({
  sendNotification: vi.fn().mockResolvedValue({
    success: true,
    notificationId: "notification-123",
  }),
  sendRankingUpdate: vi.fn().mockResolvedValue({
    success: true,
    notificationIds: ["notification-1", "notification-2"],
  }),
}));

// Mock the notification service
vi.mock("../../../services/notificationService", () => ({
  NotificationService: {
    createCoinsAddedNotification: vi.fn().mockReturnValue({
      title: "💰 Group received coins!",
      body: "Your guild received 50 coins!",
      url: "/group/my",
    }),
    createCoinsRemovedNotification: vi.fn().mockReturnValue({
      title: "💸 Group - Coins Seized",
      body: "Your guild lost 20 coins!",
      url: "/group/my",
    }),
    createNewMemberNotification: vi.fn().mockReturnValue({
      title: "👥 New member in Group!",
      body: "John joined your guild!",
      url: "/group/my",
    }),
    createRankingUpdateNotification: vi.fn().mockReturnValue({
      title: "🏆 Ranking update!",
      body: "Group now holds 1 place in the ranking!",
      url: "/ranking",
    }),
  },
  sendMobileNotifications: vi.fn().mockResolvedValue({
    success: true,
    sent: 10,
    failed: 0,
    total: 10,
  }),
}));

// Mock @mirai-app/auth
vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "auth-123" },
    dbUser: {
      id: "user-123",
      authUserId: "auth-123",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      hasAvatar: false,
      wristNumber: null,
      houseNumber: null,
      role: "USER",
      groupId: null,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
  requireModerator: vi.fn().mockResolvedValue({
    id: "moderator-123",
    authUserId: "auth-123",
    email: "moderator@example.com",
    firstName: "Test",
    lastName: "Moderator",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "MODERATOR",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-123",
    authUserId: "auth-123",
    email: "admin@example.com",
    firstName: "Test",
    lastName: "Admin",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "ADMIN",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

const createCaller = (ctx: TRPCContext) => createRouterClient(notificationRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock push subscription
const createMockPushSubscription = (overrides: Partial<PushSubscription> = {}): PushSubscription => ({
  id: "sub-123",
  userId: "user-123",
  token: "expo-push-token-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock notification
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "notification-123",
  title: "Test Notification",
  body: "Test body",
  url: "/test",
  createdById: "moderator-123",
  tripId: "trip-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock notification push
const createMockNotificationPush = (overrides: Partial<NotificationPush> = {}): NotificationPush => ({
  id: "push-123",
  notificationId: "notification-123",
  targetUserId: "user-123",
  status: "sent",
  sentAt: new Date(),
  failureReason: null,
  ...overrides,
});

// Helper to create mock group
const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "group-123",
  name: "Test Group",
  description: "A test group",
  image: null,
  code: "1234",
  coins: 100,
  tripId: "trip-123",
  organizerId: "user-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock trip participant
const createMockTripParticipant = (overrides: Partial<TripParticipant> = {}): TripParticipant => ({
  id: "participant-123",
  tripId: "trip-123",
  userId: "user-123",
  groupId: "group-123",
  joinedAt: new Date(),
  ...overrides,
});

// Drizzle chain helpers
const createInsertChain = (returnValue: any[] = []) => ({
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returnValue),
});

const createDeleteChain = (returnValue: any[] = []) => ({
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returnValue),
});

const createUpdateChain = (returnValue: any = { count: 0 }) => ({
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(returnValue),
});

const createSelectChain = (returnValue: any[] = []) => {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    then: vi.fn((resolve: any) => Promise.resolve(returnValue).then(resolve)),
  };
  return chain;
};

describe("notificationRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockModeratorUser: User;
  let mockAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123", authUserId: "auth-123", role: "USER" });
    mockModeratorUser = createMockUser({ id: "moderator-123", authUserId: "auth-123", role: "MODERATOR" });
    mockAdminUser = createMockUser({ id: "admin-123", authUserId: "auth-123", role: "ADMIN" });

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } satisfies SupabaseClient;

    mockDb = {
      insert: vi.fn(() => createInsertChain()),
      delete: vi.fn(() => createDeleteChain()),
      update: vi.fn(() => createUpdateChain()),
      select: vi.fn(() => createSelectChain()),
      query: {
        pushSubscriptions: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        notifications: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        groups: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        users: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        notificationPushes: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    } as unknown as DB;
  });

  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("subscribe", () => {
    it("should create new push subscription", async () => {
      const subscription = createMockPushSubscription({
        id: "new-sub-123",
        userId: "user-123",
        token: "new-token",
      });

      const chain = createInsertChain([subscription]);
      (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "new-token" });

      expect(result.success).toBe(true);
      expect(result.id).toBe("new-sub-123");
      expect(mockDb.insert).toHaveBeenCalledWith(pushSubscriptions);
      expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-123", token: "new-token" }));
      expect(chain.onConflictDoUpdate).toHaveBeenCalled();
      expect(chain.returning).toHaveBeenCalled();
    });

    it("should update existing subscription timestamp", async () => {
      const existingSubscription = createMockPushSubscription({
        id: "existing-sub",
        userId: "user-123",
        token: "existing-token",
      });

      const chain = createInsertChain([existingSubscription]);
      (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.subscribe({ token: "existing-token" });

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(pushSubscriptions);
      expect(chain.values).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const chain = createInsertChain();
      chain.returning.mockRejectedValue(new Error("DB error"));
      (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.subscribe({ token: "test-token" })).rejects.toThrow();
    });
  });

  describe("unsubscribe", () => {
    it("should delete push subscription by token", async () => {
      const chain = createDeleteChain([createMockPushSubscription()]);
      (mockDb.delete as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribe({ token: "test-token" });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(mockDb.delete).toHaveBeenCalledWith(pushSubscriptions);
      expect(chain.where).toHaveBeenCalled();
      expect(chain.returning).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when subscription does not exist", async () => {
      const chain = createDeleteChain([]);
      (mockDb.delete as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.unsubscribe({ token: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("unsubscribeAll", () => {
    it("should delete all user push subscriptions", async () => {
      const chain = createDeleteChain([
        createMockPushSubscription(),
        createMockPushSubscription(),
        createMockPushSubscription(),
      ]);
      (mockDb.delete as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.unsubscribeAll();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(mockDb.delete).toHaveBeenCalledWith(pushSubscriptions);
      expect(chain.where).toHaveBeenCalled();
      expect(chain.returning).toHaveBeenCalled();
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should return subscription status with subscriptions", async () => {
      const subscriptions = [
        createMockPushSubscription({ id: "sub-1", token: "token-1" }),
        createMockPushSubscription({ id: "sub-2", token: "token-2" }),
      ];

      (mockDb.query.pushSubscriptions.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(subscriptions);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions[0].token).toBe("token-1");
    });

    it("should return not subscribed when no subscriptions", async () => {
      (mockDb.query.pushSubscriptions.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getSubscriptionStatus();

      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptions).toHaveLength(0);
    });
  });

  describe("getAllMy", () => {
    it("should get user notifications with pagination", async () => {
      const notificationsList = [
        createMockNotification({ id: "notif-1" }),
        createMockNotification({ id: "notif-2" }),
      ];

      const pushRows = notificationsList.map((n) => ({ notificationId: n.id }));
      const selectChain = createSelectChain(pushRows);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);
      (mockDb.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(notificationsList);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAllMy({ page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockDb.select).toHaveBeenCalledWith({ notificationId: notificationPushes.notificationId });
      expect(selectChain.from).toHaveBeenCalledWith(notificationPushes);
      expect(mockDb.query.notifications.findMany).toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when page exceeds total pages", async () => {
      const selectChain = createSelectChain([]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getAllMy({ page: 10, pageSize: 10 })).rejects.toThrow(ORPCError);
    });
  });

  describe("getAll", () => {
    it("should get all notifications with pagination for admin", async () => {
      const notificationsList = [
        createMockNotification({ id: "notif-1", pushes: [{ targetUserId: "user-1", sentAt: new Date(), status: "sent", failureReason: null }] }),
        createMockNotification({ id: "notif-2", pushes: [{ targetUserId: "user-2", sentAt: new Date(), status: "sent", failureReason: null }] }),
      ];

      (mockDb.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(notificationsList);
      const countChain = createSelectChain([{ count: 2 }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(countChain);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        tripId: "trip-123",
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(mockDb.query.notifications.findMany).toHaveBeenCalled();
      expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({ count: expect.anything() }));
      expect(countChain.from).toHaveBeenCalledWith(notifications);
    });

    it("should filter notifications by tripId", async () => {
      const notificationsList = [createMockNotification({ id: "notif-1", tripId: "trip-123" })];

      (mockDb.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(notificationsList);
      const countChain = createSelectChain([{ count: 1 }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(countChain);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.notifications).toHaveLength(1);
      expect(mockDb.query.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });
  });

  describe("sendToGroup", () => {
    it("should send notification to group members", async () => {
      const { sendNotification } = await import("../../../utils/notifications");
      const { sendMobileNotifications } = await import("../../../services/notificationService");

      const group = createMockGroup({ id: "group-123", tripId: "trip-123" });
      const participants = [
        createMockTripParticipant({ userId: "user-1" }),
        createMockTripParticipant({ userId: "user-2" }),
      ];

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      const selectChain = createSelectChain(participants.map((p) => ({ userId: p.userId })));
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.sendToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
      });

      expect(sendNotification).toHaveBeenCalled();
      expect(sendMobileNotifications).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when group belongs to different trip", async () => {
      const group = createMockGroup({ id: "group-123", tripId: "different-trip" });

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.sendToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          title: "Test",
          body: "Test",
          url: "/test",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group is deleted", async () => {
      const group = createMockGroup({ id: "group-123", tripId: "trip-123", isDeleted: true });

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.sendToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          title: "Test",
          body: "Test",
          url: "/test",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("sendToAll", () => {
    it("should send notification to all trip participants", async () => {
      const { sendNotification } = await import("../../../utils/notifications");
      const { sendMobileNotifications } = await import("../../../services/notificationService");

      const participants = [
        createMockTripParticipant({ userId: "user-1" }),
        createMockTripParticipant({ userId: "user-2" }),
        createMockTripParticipant({ userId: "user-3" }),
      ];

      const selectChain = createSelectChain(participants.map((p) => ({ userId: p.userId })));
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.sendToAll({
        tripId: "trip-123",
        title: "All Users",
        body: "Message to all",
        url: "/all",
      });

      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            userIds: ["user-1", "user-2", "user-3"],
            title: "All Users",
            body: "Message to all",
            url: "/all",
            tripId: "trip-123",
          }),
        })
      );
      expect(sendMobileNotifications).toHaveBeenCalled();
    });
  });

  describe("sendRankingUpdateToGroups", () => {
    it("should send ranking update notifications", async () => {
      const { sendRankingUpdate } = await import("../../../utils/notifications");

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.sendRankingUpdateToGroups({ tripId: "trip-123" });

      expect(sendRankingUpdate).toHaveBeenCalledWith({
        db: mockDb,
        userId: "moderator-123",
        tripId: "trip-123",
      });
      expect(result.success).toBe(true);
      expect(result.notificationIds).toEqual(["notification-1", "notification-2"]);
    });
  });

  describe("sendCoinAddedToGroup", () => {
    it("should send coins added notification to group", async () => {
      const { sendNotification } = await import("../../../utils/notifications");
      const { NotificationService } = await import("../../../services/notificationService");

      const group = createMockGroup({ id: "group-123", tripId: "trip-123", name: "Test Group" });
      const participants = [createMockTripParticipant({ userId: "user-1" })];

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      const selectChain = createSelectChain([{ userId: "user-1" }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.sendCoinAddedToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        coins: 50,
        reason: "Bonus",
      });

      expect(NotificationService.createCoinsAddedNotification).toHaveBeenCalledWith("Test Group", 50, "Bonus");
      expect(sendNotification).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when group belongs to different trip", async () => {
      const group = createMockGroup({ id: "group-123", tripId: "different-trip" });

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.sendCoinAddedToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          coins: 50,
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("sendCoinRemovedFromGroup", () => {
    it("should send coins removed notification to group", async () => {
      const { sendNotification } = await import("../../../utils/notifications");
      const { NotificationService } = await import("../../../services/notificationService");

      const group = createMockGroup({ id: "group-123", tripId: "trip-123", name: "Test Group" });
      const participants = [createMockTripParticipant({ userId: "user-1" })];

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      const selectChain = createSelectChain([{ userId: "user-1" }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.sendCoinRemovedFromGroup({
        tripId: "trip-123",
        groupId: "group-123",
        coins: 20,
        reason: "Penalty",
      });

      expect(NotificationService.createCoinsRemovedNotification).toHaveBeenCalledWith("Test Group", 20, "Penalty");
      expect(sendNotification).toHaveBeenCalled();
    });
  });

  describe("sendNewMemberToGroup", () => {
    it("should send new member notification to group", async () => {
      const { sendNotification } = await import("../../../utils/notifications");
      const { NotificationService } = await import("../../../services/notificationService");

      const group = createMockGroup({ id: "group-123", tripId: "trip-123", name: "Test Group" });
      const user = createMockUser({ id: "new-user-123", firstName: "John", lastName: "Doe" });
      const participants = [createMockTripParticipant({ userId: "user-1" })];

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      (mockDb.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(user);
      const selectChain = createSelectChain([{ userId: "user-1" }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.sendNewMemberToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        userId: "new-user-123",
      });

      expect(NotificationService.createNewMemberNotification).toHaveBeenCalledWith("Test Group", "John Doe");
      expect(sendNotification).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when user does not exist", async () => {
      const group = createMockGroup({ id: "group-123", tripId: "trip-123" });

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      (mockDb.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.sendNewMemberToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          userId: "non-existent",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("sendCustomToGroup", () => {
    it("should send custom notification to group", async () => {
      const { sendNotification } = await import("../../../utils/notifications");

      const group = createMockGroup({ id: "group-123", tripId: "trip-123" });
      const participants = [createMockTripParticipant({ userId: "user-1" })];

      (mockDb.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(group);
      const selectChain = createSelectChain([{ userId: "user-1" }]);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.sendCustomToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        title: "Custom Title",
        body: "Custom Body",
        url: "/custom",
      });

      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            title: "Custom Title",
            body: "Custom Body",
            url: "/custom",
          }),
        })
      );
    });
  });

  describe("retryNotification", () => {
    it("should retry failed notification pushes", async () => {
      const { sendMobileNotifications } = await import("../../../services/notificationService");

      const notification = createMockNotification({ id: "notification-123" });
      const failedPushes = [
        createMockNotificationPush({ status: "failed", targetUserId: "user-1" }),
        createMockNotificationPush({ status: "failed", targetUserId: "user-2" }),
      ];

      (mockDb.query.notifications.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(notification);
      (mockDb.query.notificationPushes.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(failedPushes);

      const updateChain = createUpdateChain({ count: 2 });
      (mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.retryNotification({
        notificationId: "notification-123",
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe("notification-123");
      expect(result.retriedCount).toBe(2);
      expect(mockDb.update).toHaveBeenCalledWith(notificationPushes);
      expect(updateChain.set).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", sentAt: null, failureReason: null }));
      expect(updateChain.where).toHaveBeenCalled();
      expect(sendMobileNotifications).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when notification does not exist", async () => {
      (mockDb.query.notifications.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.retryNotification({
          notificationId: "non-existent",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when no failed pushes to retry", async () => {
      const notification = createMockNotification({ id: "notification-123" });

      (mockDb.query.notifications.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(notification);
      (mockDb.query.notificationPushes.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.retryNotification({
          notificationId: "notification-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("delete", () => {
    it("should delete notification", async () => {
      const chain = createDeleteChain([]);
      (mockDb.delete as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.delete({
        notificationId: "notification-123",
      });

      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith(notifications);
      expect(chain.where).toHaveBeenCalled();
    });
  });
});
