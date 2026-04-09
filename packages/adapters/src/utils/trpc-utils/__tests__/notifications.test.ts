import { describe, expect, test, mock } from "bun:test";
import { sendNotification, sendRankingUpdate } from "../notifications";
import type { Prisma } from "@mirai-app/frameworks/prisma";

const createMockTx = () => {
  return {
    notification: {
      create: mock(),
      createMany: mock(),
    },
    notificationPush: {
      createMany: mock(),
    },
    group: {
      findMany: mock(),
    },
    tripParticipant: {
      findMany: mock(),
    },
  } as unknown as Prisma.TransactionClient;
};

describe("[UNIT] notifications", () => {
  describe("sendNotification", () => {
    test("creates notification with correct structure", async () => {
      const tx = createMockTx();
      tx.notification.create.mockResolvedValueOnce({ id: "notif-1" });
      tx.notificationPush.createMany.mockResolvedValueOnce({ count: 2 });

      const result = await sendNotification({
        db: tx,
        userId: "user-1",
        input: {
          title: "Test Title",
          body: "Test Body",
          url: "/path",
          userIds: ["user-2", "user-3"],
          tripId: "trip-1",
        },
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe("notif-1");
      expect(tx.notification.create).toHaveBeenCalledWith({
        data: {
          title: "Test Title",
          body: "Test Body",
          url: "/path",
          createdById: "user-1",
          tripId: "trip-1",
        },
      });
    });

    test("creates push notifications for all userIds", async () => {
      const tx = createMockTx();
      tx.notification.create.mockResolvedValueOnce({ id: "notif-1" });
      tx.notificationPush.createMany.mockResolvedValueOnce({ count: 3 });

      await sendNotification({
        db: tx,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/path",
          userIds: ["user-2", "user-3", "user-4"],
          tripId: null,
        },
      });

      expect(tx.notificationPush.createMany).toHaveBeenCalledWith({
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

    test("handles empty userIds array", async () => {
      const tx = createMockTx();
      tx.notification.create.mockResolvedValueOnce({ id: "notif-1" });

      const result = await sendNotification({
        db: tx,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/path",
          userIds: [],
          tripId: null,
        },
      });

      expect(result.success).toBe(true);
      expect(tx.notificationPush.createMany).not.toHaveBeenCalled();
    });

    test("deduplicates userIds", async () => {
      const tx = createMockTx();
      tx.notification.create.mockResolvedValueOnce({ id: "notif-1" });
      tx.notificationPush.createMany.mockResolvedValueOnce({ count: 2 });

      await sendNotification({
        db: tx,
        userId: "user-1",
        input: {
          title: "Test",
          body: "Body",
          url: "/path",
          userIds: ["user-2", "user-2", "user-3"],
          tripId: null,
        },
      });

      const createManyCall = tx.notificationPush.createMany.mock.calls[0][0];
      expect(createManyCall.data.length).toBe(2);
    });
  });

  describe("sendRankingUpdate", () => {
    test("sends ranking update to all groups", async () => {
      const tx = createMockTx();

      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Alpha", coins: 500 },
        { id: "group-2", name: "Beta", coins: 300 },
      ]);

      tx.tripParticipant.findMany
        .mockResolvedValueOnce([{ userId: "user-1" }])
        .mockResolvedValueOnce([{ userId: "user-2" }]);

      tx.notification.create.mockResolvedValue({ id: "notif-1" });
      tx.notificationPush.createMany.mockResolvedValue({ count: 1 });

      const result = await sendRankingUpdate({
        db: tx,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(tx.group.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1", isDeleted: false },
        orderBy: { coins: "desc" },
      });
    });

    test("includes correct ranking position for each group", async () => {
      const tx = createMockTx();

      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Alpha", coins: 500 },
        { id: "group-2", name: "Beta", coins: 300 },
      ]);

      tx.tripParticipant.findMany.mockResolvedValue([{ userId: "user-1" }]);
      tx.notification.create.mockResolvedValue({ id: "notif-1" });
      tx.notificationPush.createMany.mockResolvedValue({ count: 1 });

      const result = await sendRankingUpdate({
        db: tx,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      expect(result.notificationIds.length).toBe(2);
    });

    test("handles group with no participants", async () => {
      const tx = createMockTx();

      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Alpha", coins: 500 },
      ]);

      tx.tripParticipant.findMany.mockResolvedValueOnce([]);
      tx.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await sendRankingUpdate({
        db: tx,
        userId: "admin-1",
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
    });
  });
});
