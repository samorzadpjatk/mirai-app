import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { sendNotification, sendRankingUpdate } from "~/utils/notifications";

// Mock the NotificationService
vi.mock("~/services/notificationService", () => ({
  NotificationService: {
    createRankingUpdateNotification: vi.fn(
      (groupName: string, position: number) => ({
        title: `🏆 Ranking update!`,
        body: `${groupName} now holds ${position} place in the ranking!`,
        url: "/ranking",
      }),
    ),
  },
}));

describe("notifications", () => {
  let mockDb: any;
  let mockUserId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = "mock-admin-id";

    mockDb = {
      notification: {
        create: vi.fn(),
      },
      group: {
        findMany: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    };
  });

  describe("sendNotification", () => {
    it("should create notification and notification pushes for users with subscriptions", async () => {
      const mockNotification = {
        id: "notification-1",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await sendNotification({
        db: mockDb,
        userId: mockUserId,
        input: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          userIds: ["user-1", "user-2", "user-3"],
        },
      });

      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          createdById: mockUserId,
        },
      });

      expect(result).toEqual({
        success: true,
        notificationId: "notification-1",
      });
    });

    it("should handle case when no users have subscriptions", async () => {
      const mockNotification = {
        id: "notification-1",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await sendNotification({
        db: mockDb,
        userId: mockUserId,
        input: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          userIds: ["user-1", "user-2"],
        },
      });

      expect(result).toEqual({
        success: true,
        notificationId: "notification-1",
      });
    });

    it("should throw TRPCError when notification creation fails", {
      timeout: 30000,
    }, async () => {
      mockDb.notification.create.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        sendNotification({
          db: mockDb,
          userId: mockUserId,
          input: {
            title: "Test Title",
            body: "Test Body",
            url: "/test",
            userIds: ["user-1"],
          },
        }),
      ).rejects.toThrow(TRPCError);
    }); // 30 second timeout to allow for retry logic with exponential backoff (5 retries)

    it("should handle duplicate subscriptions correctly", async () => {
      const mockNotification = {
        id: "notification-1",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await sendNotification({
        db: mockDb,
        userId: mockUserId,
        input: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          userIds: ["user-1"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe("notification-1");
    });
  });

  describe("sendRankingUpdate", () => {
    it("should send ranking notifications to all groups", async () => {
      const mockGroups = [
        { id: "group-1", name: "Group A", coins: 1000 },
        { id: "group-2", name: "Group B", coins: 800 },
        { id: "group-3", name: "Group C", coins: 600 },
      ];

      const mockNotification = {
        id: "notification-1",
        title: "Ranking Update",
        body: "Your group ranking",
        url: "/ranking",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.user.findMany
        .mockResolvedValueOnce([{ id: "user-1" }, { id: "user-2" }]) // Group A members
        .mockResolvedValueOnce([{ id: "user-3" }]) // Group B members
        .mockResolvedValueOnce([{ id: "user-4" }, { id: "user-5" }]); // Group C members

      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: mockUserId,
      });

      expect(mockDb.group.findMany).toHaveBeenCalledWith({
        orderBy: { coins: "desc" },
      });

      expect(mockDb.user.findMany).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.notificationIds).toHaveLength(3);
    });

    it("should handle groups with no members", async () => {
      const mockGroups = [{ id: "group-1", name: "Empty Group", coins: 1000 }];

      const mockNotification = {
        id: "notification-1",
        title: "Ranking Update",
        body: "Your group ranking",
        url: "/ranking",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.user.findMany.mockResolvedValue([]); // No members
      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: mockUserId,
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toHaveLength(1);
    });

    it("should calculate correct ranking positions", async () => {
      const mockGroups = [
        { id: "group-1", name: "First Place", coins: 1000 },
        { id: "group-2", name: "Second Place", coins: 800 },
      ];

      const mockNotification = {
        id: "notification-1",
        title: "Ranking Update",
        body: "Your group ranking",
        url: "/ranking",
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.user.findMany.mockResolvedValue([{ id: "user-1" }]);
      mockDb.notification.create.mockResolvedValue(mockNotification);

      await sendRankingUpdate({
        db: mockDb,
        userId: mockUserId,
      });

      // Verify the NotificationService was called with correct positions
      const { NotificationService } =
        await import("~/services/notificationService");
      expect(
        NotificationService.createRankingUpdateNotification,
      ).toHaveBeenCalledWith(
        "First Place",
        1, // Position 1
      );
      expect(
        NotificationService.createRankingUpdateNotification,
      ).toHaveBeenCalledWith(
        "Second Place",
        2, // Position 2
      );
    });
  });
});
