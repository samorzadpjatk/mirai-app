import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { sendNotification, sendRankingUpdate } from "../notifications";
import type { Prisma } from "@mirai-app/db";

// Mock the resilience module to simulate retry behavior without delays
vi.mock("../resilience", () => ({
  executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      return await fn();
    } catch (error) {
      return await fn();
    }
  }),
}));

describe("notifications", () => {
  let mockDb: Prisma.TransactionClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      notification: {
        create: vi.fn(),
      },
      notificationPush: {
        createMany: vi.fn(),
      },
      group: {
        findMany: vi.fn(),
      },
      tripParticipant: {
        findMany: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient;

    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("sendNotification", () => {
    it("should create notification successfully", async () => {
      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
        createdById: "user-1",
        tripId: "trip-1",
      } as never);

      const result = await sendNotification({
        db: mockDb,
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
      expect(result.notificationId).toBe("notif-1");
      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: {
          title: "Test Title",
          body: "Test Body",
          url: "/test",
          createdById: "user-1",
          tripId: "trip-1",
        },
      });
    });

    it("should deduplicate user IDs", async () => {
      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      await sendNotification({
        db: mockDb,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2", "user-2", "user-2"],
          tripId: "trip-1",
        },
      });

      expect(mockDb.notificationPush.createMany).toHaveBeenCalledWith({
        data: [
          {
            notificationId: "notif-1",
            targetUserId: "user-2",
            status: "pending",
            sentAt: null,
            failureReason: null,
          },
        ],
        skipDuplicates: true,
      });
    });

    it("should create notification pushes for all users", async () => {
      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      await sendNotification({
        db: mockDb,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2", "user-3", "user-4"],
          tripId: "trip-1",
        },
      });

      expect(mockDb.notificationPush.createMany).toHaveBeenCalledWith({
        data: [
          {
            notificationId: "notif-1",
            targetUserId: "user-2",
            status: "pending",
            sentAt: null,
            failureReason: null,
          },
          {
            notificationId: "notif-1",
            targetUserId: "user-3",
            status: "pending",
            sentAt: null,
            failureReason: null,
          },
          {
            notificationId: "notif-1",
            targetUserId: "user-4",
            status: "pending",
            sentAt: null,
            failureReason: null,
          },
        ],
        skipDuplicates: true,
      });
    });

    it("should handle empty userIds array", async () => {
      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      const result = await sendNotification({
        db: mockDb,
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
      // When userIds is empty, createMany is not called (implementation skips it)
      expect(mockDb.notificationPush.createMany).not.toHaveBeenCalled();
    });

    it("should handle null tripId", async () => {
      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      await sendNotification({
        db: mockDb,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/test",
          userIds: ["user-2"],
          tripId: null,
        },
      });

      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: null,
        }),
      });
    });

    it("should throw TRPCError when notification creation fails", async () => {
      vi.mocked(mockDb.notification.create).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        sendNotification({
          db: mockDb,
          userId: "user-1",
          input: {
            title: "Test",
            body: "Body",
            url: "/test",
            userIds: ["user-2"],
            tripId: "trip-1",
          },
        })
      ).rejects.toThrow(TRPCError);

      await expect(
        sendNotification({
          db: mockDb,
          userId: "user-1",
          input: {
            title: "Test",
            body: "Body",
            url: "/test",
            userIds: ["user-2"],
            tripId: "trip-1",
          },
        })
      ).rejects.toThrow("Failed to create notification");
    }, 30000); // Increase timeout for retry logic

    it("should retry on transient failures", async () => {
      vi.mocked(mockDb.notification.create)
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockResolvedValueOnce({ id: "notif-1" } as never);

      const result = await sendNotification({
        db: mockDb,
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
      expect(mockDb.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendRankingUpdate", () => {
    it("should send notifications to all groups", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
        { id: "group-2", name: "Group B", coins: 80 },
        { id: "group-3", name: "Group C", coins: 60 },
      ] as never);

      vi.mocked(mockDb.tripParticipant.findMany)
        .mockResolvedValueOnce([
          { userId: "user-1" },
          { userId: "user-2" },
        ] as never)
        .mockResolvedValueOnce([{ userId: "user-3" }] as never)
        .mockResolvedValueOnce([{ userId: "user-4" }, { userId: "user-5" }] as never);

      vi.mocked(mockDb.notification.create)
        .mockResolvedValueOnce({ id: "notif-1" } as never)
        .mockResolvedValueOnce({ id: "notif-2" } as never)
        .mockResolvedValueOnce({ id: "notif-3" } as never);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toHaveLength(3);
      expect(mockDb.group.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1", isDeleted: false },
        orderBy: { coins: "desc" },
      });
    });

    it("should return empty success when no groups exist", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([]);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toEqual([]);
    });

    it("should include correct ranking position in notification", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([
        { id: "group-1", name: "First Place", coins: 200 },
        { id: "group-2", name: "Second Place", coins: 100 },
      ] as never);

      vi.mocked(mockDb.tripParticipant.findMany)
        .mockResolvedValueOnce([{ userId: "user-1" }] as never)
        .mockResolvedValueOnce([{ userId: "user-2" }] as never);

      vi.mocked(mockDb.notification.create)
        .mockResolvedValueOnce({ id: "notif-1" } as never)
        .mockResolvedValueOnce({ id: "notif-2" } as never);

      await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      const firstCall = vi.mocked(mockDb.notification.create).mock.calls[0];
      expect(firstCall?.[0].data.title).toContain("Ranking");
      expect(firstCall?.[0].data.body).toContain("First Place");
    });

    it("should query participants for each group", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
      ] as never);

      vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ] as never);

      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(mockDb.tripParticipant.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1", groupId: "group-1" },
        select: { userId: true },
      });
    });

    it("should handle groups with no participants", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
      ] as never);

      vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([]);

      vi.mocked(mockDb.notification.create).mockResolvedValue({
        id: "notif-1",
      } as never);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      // When there are no participants, createMany is not called (implementation skips it)
      expect(mockDb.notificationPush.createMany).not.toHaveBeenCalled();
    });

    it("should return partial success when some notifications fail", async () => {
      vi.mocked(mockDb.group.findMany).mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
        { id: "group-2", name: "Group B", coins: 80 },
      ] as never);

      vi.mocked(mockDb.tripParticipant.findMany)
        .mockResolvedValueOnce([{ userId: "user-1" }] as never)
        .mockResolvedValueOnce([{ userId: "user-2" }] as never);

      vi.mocked(mockDb.notification.create)
        .mockResolvedValueOnce({ id: "notif-1" } as never)
        .mockRejectedValueOnce(new Error("Database error"));

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(false);
      expect(result.notificationIds).toContain("notif-1");
    }, 30000); // Increase timeout for retry logic
  });
});
