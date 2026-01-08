import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { notificationRouter } from "~/api/routers/notifications";
import type { AppRouter } from "~/api/root";

// Mock the mobile notifications utilities
vi.mock("~/utils/notifications", () => ({
  sendNotification: vi.fn(),
  sendRankingUpdate: vi.fn(),
}));

// Mock NotificationService
vi.mock("~/services/notificationService", () => ({
  NotificationService: {
    createCoinsAddedNotification: vi.fn(),
    createCoinsRemovedNotification: vi.fn(),
    createNewMemberNotification: vi.fn(),
  },
}));

describe("notificationRouter", () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      db: {
        pushSubscription: {
          upsert: vi.fn(),
          deleteMany: vi.fn(),
          findMany: vi.fn(),
        },
        notification: {
          count: vi.fn(),
          findMany: vi.fn(),
          findFirst: vi.fn(),
          delete: vi.fn(),
        },
        notificationPush: {
          findMany: vi.fn(),
        },
        user: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        group: {
          findFirst: vi.fn(),
        },
      },
      dbUser: {
        id: "mock-user-id",
        isAdmin: true,
        isModerator: true,
      },
      session: {
        user: {
          id: "auth-user-123",
        },
      },
    };
  });

  describe("subscribe", () => {
    it("should successfully subscribe a user to notifications", async () => {
      const mockSubscription = {
        id: "sub-123",
        userId: "mock-user-id",
        token: "ExponentPushToken[test]",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.db.pushSubscription.upsert.mockResolvedValue(
        mockSubscription,
      );

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.subscribe({
        token: "ExponentPushToken[test]",
      });

      expect(result).toEqual({
        success: true,
        id: "sub-123",
      });

      expect(mockContext.db.pushSubscription.upsert).toHaveBeenCalledWith({
        where: {
          userId_token: {
            userId: "mock-user-id",
            token: "ExponentPushToken[test]",
          },
        },
        update: {
          updatedAt: expect.any(Date),
        },
        create: {
          userId: "mock-user-id",
          token: "ExponentPushToken[test]",
        },
      });
    });

    it("should handle database errors during subscription", async () => {
      mockContext.db.pushSubscription.upsert.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.subscribe({
          token: "ExponentPushToken[test]",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("unsubscribe", () => {
    it("should successfully unsubscribe a specific token", async () => {
      mockContext.db.pushSubscription.deleteMany.mockResolvedValue({
        count: 1,
      });

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.unsubscribe({
        token: "ExponentPushToken[test]",
      });

      expect(result).toEqual({
        success: true,
        deletedCount: 1,
      });

      expect(mockContext.db.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "mock-user-id",
          token: "ExponentPushToken[test]",
        },
      });
    });

    it("should throw NOT_FOUND error when token does not exist", async () => {
      mockContext.db.pushSubscription.deleteMany.mockResolvedValue({
        count: 0,
      });

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.unsubscribe({
          token: "nonexistent-token",
        }),
      ).rejects.toThrow("No subscription found with that token");
    });

    it("should handle database errors during unsubscription", async () => {
      mockContext.db.pushSubscription.deleteMany.mockRejectedValue(
        new Error("Database error"),
      );

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.unsubscribe({
          token: "ExponentPushToken[test]",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("unsubscribeAll", () => {
    it("should unsubscribe all user devices", async () => {
      mockContext.db.pushSubscription.deleteMany.mockResolvedValue({
        count: 3,
      });

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.unsubscribeAll();

      expect(result).toEqual({
        success: true,
        deletedCount: 3,
      });

      expect(mockContext.db.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "mock-user-id",
        },
      });
    });

    it("should handle case when user has no subscriptions", async () => {
      mockContext.db.pushSubscription.deleteMany.mockResolvedValue({
        count: 0,
      });

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.unsubscribeAll();

      expect(result.deletedCount).toBe(0);
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should return all user subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: "sub-1",
          token: "ExponentPushToken[1]",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "sub-2",
          token: "fcm-token",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      mockContext.db.pushSubscription.findMany.mockResolvedValue(
        mockSubscriptions,
      );

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.getSubscriptionStatus();

      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions[0]).toEqual({
        id: "sub-1",
        token: "ExponentPushToken[1]",
        createdAt: expect.any(Date),
      });
    });

    it("should return empty array when user has no subscriptions", async () => {
      mockContext.db.pushSubscription.findMany.mockResolvedValue([]);

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.getSubscriptionStatus();

      expect(result.subscriptions).toEqual([]);
    });
  });

  describe("getAllMy", () => {
    it("should return paginated notifications for current user", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          title: "Test Notification",
          body: "Test Body",
          url: "/test",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: "admin-123",
          createdBy: { id: "admin-123", name: "Admin User" },
        },
      ];

      mockContext.db.notification.count.mockResolvedValue(25);
      mockContext.db.notification.findMany.mockResolvedValue(mockNotifications);

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.getAllMy({ page: 1, pageSize: 20 });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 25,
        page: 1,
        pageSize: 20,
        totalPages: 2,
      });
    });

    it("should throw error when page exceeds total pages", async () => {
      mockContext.db.notification.count.mockResolvedValue(10);

      const caller = notificationRouter.createCaller(mockContext);

      await expect(caller.getAllMy({ page: 5, pageSize: 20 })).rejects.toThrow(
        "Page 5 exceeds total pages",
      );
    });
  });

  describe("sendToGroup", () => {
    it("should send notification to all group members", async () => {
      const { sendNotification } = await import("~/utils/notifications");
      const mockSendNotification = vi.mocked(sendNotification);

      mockContext.db.user.findMany.mockResolvedValue([
        { id: "user-1" },
        { id: "user-2" },
      ]);

      mockSendNotification.mockResolvedValue({
        success: true,
        notificationId: "notif-123",
      });

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.sendToGroup({
        groupId: "group-123",
        title: "Group Notification",
        body: "Test message",
        url: "/group",
      });

      expect(result.success).toBe(true);
      expect(mockSendNotification).toHaveBeenCalledWith({
        db: mockContext.db,
        userId: "mock-user-id",
        input: {
          userIds: ["user-1", "user-2"],
          title: "Group Notification",
          body: "Test message",
          url: "/group",
        },
      });
    });
  });

  describe("sendCoinAddedToGroup", () => {
    it("should send coin added notification with reason", async () => {
      const { sendNotification } = await import("~/utils/notifications");
      const { NotificationService } =
        await import("~/services/notificationService");
      const mockSendNotification = vi.mocked(sendNotification);
      const mockCreateNotification = vi.mocked(
        NotificationService.createCoinsAddedNotification,
      );

      mockContext.db.group.findFirst.mockResolvedValue({
        id: "group-123",
        name: "Test Group",
        coins: 100,
      });

      mockContext.db.user.findMany.mockResolvedValue([{ id: "user-1" }]);

      mockCreateNotification.mockReturnValue({
        title: "💰 Test Group received coins!",
        body: "Your guild received 50 coins!\\nReason: Good performance",
        url: "/group/my",
      });

      mockSendNotification.mockResolvedValue({
        success: true,
        notificationId: "notif-123",
      });

      const caller = notificationRouter.createCaller(mockContext);
      await caller.sendCoinAddedToGroup({
        groupId: "group-123",
        coins: 50,
        reason: "Good performance",
      });

      expect(mockCreateNotification).toHaveBeenCalledWith(
        "Test Group",
        50,
        "Good performance",
      );
    });

    it("should throw NOT_FOUND when group does not exist", async () => {
      mockContext.db.group.findFirst.mockResolvedValue(null);

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.sendCoinAddedToGroup({
          groupId: "nonexistent-group",
          coins: 50,
        }),
      ).rejects.toThrow();
    });
  });

  describe("retryNotification", () => {
    it("should retry failed notification pushes", async () => {
      const { sendNotification } = await import("~/utils/notifications");
      const mockSendNotification = vi.mocked(sendNotification);

      mockContext.db.notification.findFirst.mockResolvedValue({
        id: "notif-123",
        title: "Test",
        body: "Test",
        url: "/test",
      });

      mockContext.db.notificationPush.findMany.mockResolvedValue([
        {
          targetUserId: "user-1",
          notificationId: "notif-123",
          status: "failed",
        },
        {
          targetUserId: "user-2",
          notificationId: "notif-123",
          status: "failed",
        },
      ]);

      mockSendNotification.mockResolvedValue({
        success: true,
        notificationId: "notif-123",
      });

      const caller = notificationRouter.createCaller(mockContext);
      await caller.retryNotification({ notificationId: "notif-123" });

      expect(mockSendNotification).toHaveBeenCalledWith({
        db: mockContext.db,
        userId: "mock-user-id",
        input: {
          userIds: ["user-1", "user-2"],
          title: "Test",
          body: "Test",
          url: "/test",
        },
      });
    });

    it("should throw error when notification not found", async () => {
      mockContext.db.notification.findFirst.mockResolvedValue(null);

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.retryNotification({ notificationId: "nonexistent" }),
      ).rejects.toThrow();
    });

    it("should throw error when no failed pushes exist", async () => {
      mockContext.db.notification.findFirst.mockResolvedValue({
        id: "notif-123",
        title: "Test",
        body: "Test",
        url: "/test",
      });

      mockContext.db.notificationPush.findMany.mockResolvedValue([]);

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.retryNotification({ notificationId: "notif-123" }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a notification (admin only)", async () => {
      mockContext.db.notification.delete.mockResolvedValue({
        id: "notif-123",
        title: "Test",
        body: "Test",
        url: "/test",
      });

      const caller = notificationRouter.createCaller(mockContext);
      const result = await caller.delete({ notificationId: "notif-123" });

      expect(result.success).toBe(true);
      expect(mockContext.db.notification.delete).toHaveBeenCalledWith({
        where: { id: "notif-123" },
      });
    });

    it("should handle deletion errors", async () => {
      mockContext.db.notification.delete.mockRejectedValue(
        new Error("Database error"),
      );

      const caller = notificationRouter.createCaller(mockContext);

      await expect(
        caller.delete({ notificationId: "notif-123" }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
