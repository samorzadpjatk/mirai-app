 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { sendNotification, sendRankingUpdate } from "../notifications";
import type { TransactionDB } from "@mirai-app/db";

 
const noop = (): void => {};

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

describe("notifications", () => {
  let mockDb: TransactionDB;

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
    };

    vi.spyOn(console, "error").mockImplementation(noop);
  });

  describe("sendNotification", () => {
    it("should create notification successfully", async () => {
      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
        title: "Test Title",
        body: "Test Body",
        url: "/test",
        createdById: "user-1",
        tripId: "trip-1",
      });

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
      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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
      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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
      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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
      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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

    it("should throw ORPCError when notification creation fails", async () => {
      mockDb.notification.create.mockRejectedValue(
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
      ).rejects.toThrow(ORPCError);

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
      mockDb.notification.create
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockResolvedValueOnce({ id: "notif-1" });

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
      mockDb.group.findMany.mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
        { id: "group-2", name: "Group B", coins: 80 },
        { id: "group-3", name: "Group C", coins: 60 },
      ] as never);

      mockDb.tripParticipant.findMany
        .mockResolvedValueOnce([
          { userId: "user-1" },
          { userId: "user-2" },
        ] as never)
        .mockResolvedValueOnce([{ userId: "user-3" }] as never)
        .mockResolvedValueOnce([{ userId: "user-4" }, { userId: "user-5" }] as never);

      mockDb.notification.create
        .mockResolvedValueOnce({ id: "notif-1" })
        .mockResolvedValueOnce({ id: "notif-2" })
        .mockResolvedValueOnce({ id: "notif-3" });

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
      mockDb.group.findMany.mockResolvedValue([]);

      const result = await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds).toEqual([]);
    });

    it("should include correct ranking position in notification", async () => {
      mockDb.group.findMany.mockResolvedValue([
        { id: "group-1", name: "First Place", coins: 200 },
        { id: "group-2", name: "Second Place", coins: 100 },
      ] as never);

      mockDb.tripParticipant.findMany
        .mockResolvedValueOnce([{ userId: "user-1" }] as never)
        .mockResolvedValueOnce([{ userId: "user-2" }] as never);

      mockDb.notification.create
        .mockResolvedValueOnce({ id: "notif-1" })
        .mockResolvedValueOnce({ id: "notif-2" });

      await sendRankingUpdate({
        db: mockDb,
        userId: "admin-1",
        tripId: "trip-1",
      });

      const firstCall = mockDb.notification.create.mock.calls[0] as
        | [{ data: { title: string; body: string } }]
        | undefined;
      expect(firstCall?.[0].data.title).toContain("Ranking");
      expect(firstCall?.[0].data.body).toContain("First Place");
    });

    it("should query participants for each group", async () => {
      mockDb.group.findMany.mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
      ] as never);

      mockDb.tripParticipant.findMany.mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ] as never);

      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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
      mockDb.group.findMany.mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
      ] as never);

      mockDb.tripParticipant.findMany.mockResolvedValue([]);

      mockDb.notification.create.mockResolvedValue({
        id: "notif-1",
      });

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
      mockDb.group.findMany.mockResolvedValue([
        { id: "group-1", name: "Group A", coins: 100 },
        { id: "group-2", name: "Group B", coins: 80 },
      ] as never);

      mockDb.tripParticipant.findMany
        .mockResolvedValueOnce([{ userId: "user-1" }] as never)
        .mockResolvedValueOnce([{ userId: "user-2" }] as never);

      mockDb.notification.create
        .mockResolvedValueOnce({ id: "notif-1" })
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
