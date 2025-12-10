import { describe, it, expect, vi, beforeEach } from "vitest";
import { send, sendRanking } from "~/utils/webPush";
import webpush from "web-push";

vi.mock("web-push");
vi.mock("@integral-2025-app/db");

describe("webPush utilities", () => {
  const mockDb = {
    notification: {
      create: vi.fn(),
    },
    pushSubscription: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    notificationPush: {
      createMany: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("send", () => {
    const mockInput = {
      title: "Test Notification",
      body: "Test Body",
      url: "/test",
      userIds: ["user1", "user2"],
    };

    it("should send push notifications successfully", async () => {
      const mockNotification = {
        id: "notification-1",
        title: mockInput.title,
        body: mockInput.body,
        url: mockInput.url,
        createdById: "admin-1",
      };

      const mockSubscriptions = [
        {
          id: "sub-1",
          userId: "user1",
          endpoint: "https://push.example.com/1",
          p256dh: "key1",
          auth: "auth1",
        },
        {
          id: "sub-2",
          userId: "user2",
          endpoint: "https://push.example.com/2",
          p256dh: "key2",
          auth: "auth2",
        },
      ];

      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);
      mockDb.notificationPush.createMany.mockResolvedValue({ count: 2 });

      vi.mocked(webpush.sendNotification).mockResolvedValue({
        statusCode: 201,
        body: "",
        headers: {},
      });

      const result = await send({
        db: mockDb,
        userId: "admin-1",
        input: mockInput,
      });

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(2);
      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: {
          title: mockInput.title,
          body: mockInput.body,
          url: mockInput.url,
          createdById: "admin-1",
        },
      });
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it("should return early if no subscriptions found", async () => {
      const mockNotification = {
        id: "notification-1",
        title: mockInput.title,
        body: mockInput.body,
        url: mockInput.url,
        createdById: "admin-1",
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.pushSubscription.findMany.mockResolvedValue([]);

      const result = await send({
        db: mockDb,
        userId: "admin-1",
        input: mockInput,
      });

      expect(result).toEqual({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
      });
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it("should handle failed notifications", async () => {
      const mockNotification = {
        id: "notification-1",
        title: mockInput.title,
        body: mockInput.body,
        url: mockInput.url,
        createdById: "admin-1",
      };

      const mockSubscriptions = [
        {
          id: "sub-1",
          userId: "user1",
          endpoint: "https://push.example.com/1",
          p256dh: "key1",
          auth: "auth1",
        },
      ];

      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);
      mockDb.notificationPush.createMany.mockResolvedValue({ count: 1 });

      vi.mocked(webpush.sendNotification).mockResolvedValue({
        statusCode: 500,
        body: "",
        headers: {},
      });

      const result = await send({
        db: mockDb,
        userId: "admin-1",
        input: mockInput,
      });

      expect(result.success).toBe(true);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(1);
    });

    // it("should delete invalid subscriptions (410 Gone)", async () => {
    //   const mockNotification = {
    //     id: "notification-1",
    //     title: mockInput.title,
    //     body: mockInput.body,
    //     url: mockInput.url,
    //     createdById: "admin-1",
    //   };

    //   const mockSubscriptions = [
    //     {
    //       id: "sub-1",
    //       userId: "user1",
    //       endpoint: "https://push.example.com/1",
    //       p256dh: "key1",
    //       auth: "auth1",
    //     },
    //   ];

    //   mockDb.notification.create.mockResolvedValue(mockNotification);
    //   mockDb.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);
    //   mockDb.pushSubscription.delete.mockResolvedValue({});
    //   mockDb.notificationPush.createMany.mockResolvedValue({ count: 1 });

    //   const webPushError = new Error("Gone") as any;
    //   webPushError.statusCode = 410;
    //   vi.mocked(webpush.sendNotification).mockRejectedValue(webPushError);

    //   const result = await send({
    //     db: mockDb,
    //     userId: "admin-1",
    //     input: mockInput,
    //   });

    //   expect(mockDb.pushSubscription.delete).toHaveBeenCalledWith({
    //     where: { id: "sub-1" },
    //   });
    //   expect(result.failed).toBe(1);
    // });

    it("should handle errors gracefully", async () => {
      mockDb.notification.create.mockRejectedValue(new Error("Database error"));

      await expect(
        send({
          db: mockDb,
          userId: "admin-1",
          input: mockInput,
        })
      ).rejects.toThrow("Failed to send push notification");
    });
  });

  describe("sendRanking", () => {
    it("should send ranking notifications to all groups", async () => {
      const mockGroups = [
        { id: "group-1", name: "Group 1", coins: 100 },
        { id: "group-2", name: "Group 2", coins: 80 },
      ];

      const mockUsers1 = [{ id: "user1" }, { id: "user2" }];
      const mockUsers2 = [{ id: "user3" }];

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.user.findMany
        .mockResolvedValueOnce(mockUsers1)
        .mockResolvedValueOnce(mockUsers2);

      const mockNotification = {
        id: "notification-1",
        title: "Ranking update",
        body: "Test",
        url: "/ranking",
        createdById: "admin-1",
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.pushSubscription.findMany.mockResolvedValue([
        {
          id: "sub-1",
          userId: "user1",
          endpoint: "https://push.example.com/1",
          p256dh: "key1",
          auth: "auth1",
        },
      ]);
      mockDb.notificationPush.createMany.mockResolvedValue({ count: 1 });

      vi.mocked(webpush.sendNotification).mockResolvedValue({
        statusCode: 201,
        body: "",
        headers: {},
      });

      const result = await sendRanking({
        db: mockDb,
        userId: "admin-1",
      });

      expect(result.success).toBe(true);
      expect(mockDb.group.findMany).toHaveBeenCalledWith({
        orderBy: { coins: "desc" },
      });
      expect(mockDb.notification.create).toHaveBeenCalledTimes(2);
    });

    it("should aggregate results from all groups", async () => {
      const mockGroups = [{ id: "group-1", name: "Group 1", coins: 100 }];

      const mockUsers = [{ id: "user1" }];

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.user.findMany.mockResolvedValue(mockUsers);

      const mockNotification = {
        id: "notification-1",
        title: "Ranking update",
        body: "Test",
        url: "/ranking",
        createdById: "admin-1",
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.pushSubscription.findMany.mockResolvedValue([
        {
          id: "sub-1",
          userId: "user1",
          endpoint: "https://push.example.com/1",
          p256dh: "key1",
          auth: "auth1",
        },
      ]);
      mockDb.notificationPush.createMany.mockResolvedValue({ count: 1 });

      vi.mocked(webpush.sendNotification).mockResolvedValue({
        statusCode: 201,
        body: "",
        headers: {},
      });

      const result = await sendRanking({
        db: mockDb,
        userId: "admin-1",
      });

      expect(result.sent).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(result.sent + result.failed);
    });
  });
});
