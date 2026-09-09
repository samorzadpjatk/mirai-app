import {
  groups,
  notificationPushes,
  notifications,
  pushSubscriptions,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { sendMobileNotifications } from "../../../../services/notificationService";
import { createContext } from "../../../../test-helpers";
import { sendNotification, sendRankingUpdate } from "../../../../utils/notifications";
import {
  deleteNotification,
  retryNotification,
  sendCoinAddedToGroup,
  sendCoinRemovedFromGroup,
  sendCustomToGroup,
  sendNewMemberToGroup,
  sendRankingUpdateToGroups,
  sendToAll,
  sendToGroup,
  subscribe,
  unsubscribe,
  unsubscribeAll,
} from "../mutations";

vi.mock("../../../../utils/notifications", () => ({
  sendNotification: vi.fn().mockResolvedValue({ notificationId: "notif-1" }),
  sendRankingUpdate: vi.fn().mockResolvedValue({ notificationId: "notif-2" }),
}));

vi.mock("../../../../services/notificationService", () => ({
  NotificationService: {
    createCoinsAddedNotification: vi.fn().mockReturnValue({
      title: "Coins Added",
      body: "You received coins",
      url: "https://example.com/coins",
    }),
    createCoinsRemovedNotification: vi.fn().mockReturnValue({
      title: "Coins Removed",
      body: "Coins were removed",
      url: "https://example.com/coins",
    }),
    createNewMemberNotification: vi.fn().mockReturnValue({
      title: "New Member",
      body: "A new member joined",
      url: "https://example.com/member",
    }),
  },
  sendMobileNotifications: vi.fn().mockResolvedValue({ success: true, sentCount: 1 }),
}));

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
  vi.mocked(sendMobileNotifications).mockClear();
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedUser(id: string, role: string) {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "Test",
    lastName: "User",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedGroup(id: string, tripId: string, name: string, organizerId: string) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name,
    description: "",
    organizerId,
    code: `CODE-${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("notifications mutations", () => {
  describe("subscribe", () => {
    it("saves push subscription and returns success", async () => {
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      const result = await subscribe(ctx, { token: "push-token-1" });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      const subs = await testDb.db.select().from(pushSubscriptions);
      expect(subs).toHaveLength(1);
      expect(subs[0]?.token).toBe("push-token-1");
    });
  });

  describe("unsubscribe", () => {
    it("removes push subscription and returns success", async () => {
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      await subscribe(ctx, { token: "push-token-1" });
      const result = await unsubscribe(ctx, { token: "push-token-1" });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);

      const subs = await testDb.db.select().from(pushSubscriptions);
      expect(subs).toHaveLength(0);
    });

    it("throws NOT_FOUND when subscription does not exist", async () => {
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      await expect(unsubscribe(ctx, { token: "nonexistent" })).rejects.toThrow(ORPCError);
      await expect(unsubscribe(ctx, { token: "nonexistent" })).rejects.toThrow(
        "No subscription found with that token",
      );
    });
  });

  describe("unsubscribeAll", () => {
    it("removes all push subscriptions for user", async () => {
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });

      await subscribe(ctx, { token: "push-token-1" });
      await subscribe(ctx, { token: "push-token-2" });
      const result = await unsubscribeAll(ctx);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);

      const subs = await testDb.db.select().from(pushSubscriptions);
      expect(subs).toHaveLength(0);
    });
  });

  describe("sendToGroup", () => {
    it("throws NOT_FOUND when group does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendToGroup(ctx, {
          tripId: "trip-1",
          groupId: "nonexistent",
          title: "Test",
          body: "Test",
          url: "https://example.com",
        }),
      ).rejects.toThrow("Group not found");
    });

    it("sends notification to group members", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedUser("user-2", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      await seedParticipant("tp-2", "user-2", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendToGroup(ctx, {
        tripId: "trip-1",
        groupId: "group-1",
        title: "Test",
        body: "Test body",
        url: "https://example.com",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
    });
  });

  describe("sendToAll", () => {
    it("sends notification to all trip participants", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedUser("user-2", "USER");
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-2", "trip-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendToAll(ctx, {
        tripId: "trip-1",
        title: "Test",
        body: "Test body",
        url: "https://example.com",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
    });
  });

  describe("sendRankingUpdateToGroups", () => {
    it("sends ranking update to trip groups", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendRankingUpdateToGroups(ctx, { tripId: "trip-1" });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-2");
    });
  });

  describe("sendCoinAddedToGroup", () => {
    it("throws NOT_FOUND when group does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendCoinAddedToGroup(ctx, {
          tripId: "trip-1",
          groupId: "nonexistent",
          coins: 100,
        }),
      ).rejects.toThrow("Failed to send coins added notification to group");
    });

    it("sends coin added notification to group", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendCoinAddedToGroup(ctx, {
        tripId: "trip-1",
        groupId: "group-1",
        coins: 100,
        reason: "Test reward",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
      // Creating the rows is not delivery: the push must be dispatched too.
      expect(sendMobileNotifications).toHaveBeenCalledWith(testDb.db, "notif-1");
    });
  });

  describe("sendCoinRemovedFromGroup", () => {
    it("throws NOT_FOUND when group does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendCoinRemovedFromGroup(ctx, {
          tripId: "trip-1",
          groupId: "nonexistent",
          coins: 50,
        }),
      ).rejects.toThrow("Failed to send coins removed notification to group");
    });

    it("sends coin removed notification to group", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendCoinRemovedFromGroup(ctx, {
        tripId: "trip-1",
        groupId: "group-1",
        coins: 50,
        reason: "Test penalty",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
      expect(sendMobileNotifications).toHaveBeenCalledWith(testDb.db, "notif-1");
    });
  });

  describe("sendNewMemberToGroup", () => {
    it("throws NOT_FOUND when group does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendNewMemberToGroup(ctx, {
          tripId: "trip-1",
          groupId: "nonexistent",
          userId: "user-1",
        }),
      ).rejects.toThrow("Failed to send new member notification to group");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendNewMemberToGroup(ctx, {
          tripId: "trip-1",
          groupId: "group-1",
          userId: "nonexistent",
        }),
      ).rejects.toThrow("Failed to send new member notification to group");
    });

    it("sends new member notification to group", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedUser("user-2", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendNewMemberToGroup(ctx, {
        tripId: "trip-1",
        groupId: "group-1",
        userId: "user-2",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
      expect(sendMobileNotifications).toHaveBeenCalledWith(testDb.db, "notif-1");
    });
  });

  describe("sendCustomToGroup", () => {
    it("throws NOT_FOUND when group does not exist", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(
        sendCustomToGroup(ctx, {
          tripId: "trip-1",
          groupId: "nonexistent",
          title: "Test",
          body: "Test",
          url: "https://example.com",
        }),
      ).rejects.toThrow("Failed to send custom notification to group");
    });

    it("sends custom notification to group", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      const result = await sendCustomToGroup(ctx, {
        tripId: "trip-1",
        groupId: "group-1",
        title: "Custom",
        body: "Custom body",
        url: "https://example.com",
      });

      expect(result).toBeDefined();
      expect(result.notificationId).toBe("notif-1");
      expect(sendMobileNotifications).toHaveBeenCalledWith(testDb.db, "notif-1");
    });
  });

  describe("retryNotification", () => {
    it("throws NOT_FOUND when notification does not exist", async () => {
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await expect(retryNotification(ctx, { notificationId: "nonexistent" })).rejects.toThrow(
        "Notification not found",
      );
    });

    it("throws BAD_REQUEST when no failed pushes to retry", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await testDb.db.insert(notifications).values({
        id: "notif-1",
        userId: "user-1",
        createdById: "user-1",
        title: "Test",
        body: "Test",
        url: "https://example.com",
        tripId: "trip-1",
        createdAt: new Date(),
      });

      await expect(retryNotification(ctx, { notificationId: "notif-1" })).rejects.toThrow(
        "No failed pushes to retry",
      );
    });

    it("retries failed pushes and returns retry result", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await testDb.db.insert(notifications).values({
        id: "notif-1",
        userId: "user-1",
        createdById: "user-1",
        title: "Test",
        body: "Test",
        url: "https://example.com",
        tripId: "trip-1",
        createdAt: new Date(),
      });
      await testDb.db.insert(notificationPushes).values({
        notificationId: "notif-1",
        targetUserId: "user-1",
        status: "failed",
        failureReason: "test error",
      });

      const result = await retryNotification(ctx, { notificationId: "notif-1" });

      expect(result.notificationId).toBe("notif-1");
      expect(result.retriedCount).toBe(1);

      const pushes = await testDb.db.select().from(notificationPushes);
      expect(pushes[0]?.status).toBe("pending");
      expect(pushes[0]?.failureReason).toBeNull();
    });
  });

  describe("deleteNotification", () => {
    it("deletes notification and returns success", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      await testDb.db.insert(notifications).values({
        id: "notif-1",
        userId: "user-1",
        createdById: "user-1",
        title: "Test",
        body: "Test",
        url: "https://example.com",
        tripId: "trip-1",
        createdAt: new Date(),
      });

      const result = await deleteNotification(ctx, { notificationId: "notif-1" });

      expect(result.success).toBe(true);

      const notifs = await testDb.db.select().from(notifications);
      expect(notifs).toHaveLength(0);
    });
  });

  describe("subscribe error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when db insert fails with Error (FK violation)", async () => {
      // Don't seed the user — FK violation on pushSubscriptions.userId
      const ctx = createContext(testDb, {
        dbUser: { id: "nonexistent-user", role: "USER" },
      });

      await expect(subscribe(ctx, { token: "token-fk" })).rejects.toThrow(ORPCError);
      await expect(subscribe(ctx, { token: "token-fk" })).rejects.toThrow(
        "Failed to save push subscription",
      );
    });

    it("wraps non-Error throws in Error instance", async () => {
      const mockReturning = vi.fn().mockRejectedValue("not an error");
      const mockOnConflict = vi.fn(() => ({ returning: mockReturning }));
      const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflict }));
      const mockInsert = vi.fn(() => ({ values: mockValues }));
      const mockDb = { insert: mockInsert } as unknown as DB;

      const ctx = { db: mockDb, dbUser: { id: "user-1" } };

      await expect(subscribe(ctx, { token: "token" })).rejects.toThrow(ORPCError);
      await expect(subscribe(ctx, { token: "token" })).rejects.toThrow(
        "Failed to save push subscription: not an error",
      );
    });
  });

  describe("unsubscribe error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when db delete fails with non-ORPCError", async () => {
      const mockReturning = vi.fn().mockRejectedValue(new Error("DB delete failed"));
      const mockWhere = vi.fn(() => ({ returning: mockReturning }));
      const mockDelete = vi.fn(() => ({ where: mockWhere }));
      const mockDb = { delete: mockDelete } as unknown as DB;

      const ctx = { db: mockDb, dbUser: { id: "user-1" } };

      await expect(unsubscribe(ctx, { token: "token" })).rejects.toThrow(ORPCError);
      await expect(unsubscribe(ctx, { token: "token" })).rejects.toThrow(
        "Failed to remove push subscription",
      );
    });
  });

  describe("unsubscribeAll error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when db delete fails with non-ORPCError", async () => {
      const mockReturning = vi.fn().mockRejectedValue(new Error("DB delete failed"));
      const mockWhere = vi.fn(() => ({ returning: mockReturning }));
      const mockDelete = vi.fn(() => ({ where: mockWhere }));
      const mockDb = { delete: mockDelete } as unknown as DB;

      const ctx = { db: mockDb, dbUser: { id: "user-1" } };

      await expect(unsubscribeAll(ctx)).rejects.toThrow(ORPCError);
      await expect(unsubscribeAll(ctx)).rejects.toThrow("Failed to remove all push subscriptions");
    });
  });

  describe("sendToGroup error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when sendNotification fails with non-ORPCError", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      vi.mocked(sendNotification).mockRejectedValueOnce(new Error("send failed"));

      await expect(
        sendToGroup(ctx, {
          tripId: "trip-1",
          groupId: "group-1",
          title: "Test",
          body: "Test body",
          url: "https://example.com",
        }),
      ).rejects.toThrow("Failed to send notification to group");
    });
  });

  describe("sendToAll error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when sendNotification fails with non-ORPCError", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedParticipant("tp-1", "user-1", "trip-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      vi.mocked(sendNotification).mockRejectedValueOnce(new Error("send failed"));

      await expect(
        sendToAll(ctx, {
          tripId: "trip-1",
          title: "Test",
          body: "Test body",
          url: "https://example.com",
        }),
      ).rejects.toThrow("Failed to send notification to all users");
    });
  });

  describe("sendRankingUpdateToGroups error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when sendRankingUpdate fails with non-ORPCError", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      vi.mocked(sendRankingUpdate).mockRejectedValueOnce(new Error("ranking failed"));

      await expect(sendRankingUpdateToGroups(ctx, { tripId: "trip-1" })).rejects.toThrow(
        "Failed to send ranking update notifications",
      );
    });
  });

  describe("sendNewMemberToGroup error handling", () => {
    it("wraps non-Error throws in Error instance", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedUser("user-2", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      vi.mocked(sendNotification).mockRejectedValueOnce("not an error");

      await expect(
        sendNewMemberToGroup(ctx, {
          tripId: "trip-1",
          groupId: "group-1",
          userId: "user-2",
        }),
      ).rejects.toThrow("Failed to send new member notification to group");
    });
  });

  describe("retryNotification error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when sendMobileNotifications fails with non-ORPCError", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await testDb.db.insert(notifications).values({
        id: "notif-1",
        userId: "user-1",
        createdById: "user-1",
        title: "Test",
        body: "Test",
        url: "https://example.com",
        tripId: "trip-1",
        createdAt: new Date(),
      });
      await testDb.db.insert(notificationPushes).values({
        notificationId: "notif-1",
        targetUserId: "user-1",
        status: "failed",
        failureReason: "test error",
      });

      const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "ADMIN" } });

      vi.mocked(sendMobileNotifications).mockRejectedValueOnce(new Error("push failed"));

      await expect(retryNotification(ctx, { notificationId: "notif-1" })).rejects.toThrow(
        "Failed to retry notification",
      );
    });
  });

  describe("deleteNotification error handling", () => {
    it("throws INTERNAL_SERVER_ERROR when db delete fails with non-ORPCError", async () => {
      const mockWhere = vi.fn().mockRejectedValue(new Error("DB delete failed"));
      const mockDelete = vi.fn(() => ({ where: mockWhere }));
      const mockDb = { delete: mockDelete } as unknown as DB;

      const ctx = { db: mockDb, dbUser: { id: "user-1" } };

      await expect(deleteNotification(ctx, { notificationId: "notif-1" })).rejects.toThrow(
        ORPCError,
      );
      await expect(deleteNotification(ctx, { notificationId: "notif-1" })).rejects.toThrow(
        "Failed to delete notification",
      );
    });
  });
});
