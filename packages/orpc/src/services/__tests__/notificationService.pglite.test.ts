import { challenges, notificationPushes, notifications, pushSubscriptions } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { env } from "bun";
import { eq } from "drizzle-orm";
import { Expo } from "expo-server-sdk";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { seedGroup, seedParticipant, seedTrip, seedUser } from "../../test-helpers";
import { applyRankingTemplate } from "../../utils/notificationTemplates";
import { executeWithRetry } from "../../utils/resilience";
import {
  type NotificationData,
  NotificationService,
  pruneUnregisteredTokens,
  sendMobileNotifications,
} from "../notificationService";

const noop = (): void => undefined;

type RetryFunction<T> = () => Promise<T>;

// Mock dependencies
vi.mock("expo-server-sdk", () => ({
  Expo: class MockExpo {
    constructor(_options?: { accessToken?: string }) {
      // intentionally empty
    }

    static isExpoPushToken(token: string): boolean {
      return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
    }

    chunkPushNotifications(messages: unknown[]): unknown[][] {
      const chunks: unknown[][] = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }
      return chunks;
    }

    async sendPushNotificationsAsync(messages: unknown[]): Promise<unknown[]> {
      return (messages as { to?: string }[]).map((message) => ({
        status: "ok",
        id: `ticket-${message.to}`,
      }));
    }
  },
}));

vi.mock("../../utils/resilience", () => ({
  executeWithRetry: vi.fn(),
}));

vi.mock("../../utils/notificationTemplates", () => ({
  applyRankingTemplate: vi.fn((input: string, values: Record<string, string>) => {
    let output = input;
    Object.entries(values).forEach(([key, value]) => {
      output = output.replace(new RegExp(`<${key}>`, "g"), value);
    });
    return output;
  }),
  containsRankingTemplate: vi.fn((input: string) => input.includes("<") && input.includes(">")),
}));

// Seed helpers
async function seedNotification(
  db: DB,
  id: string,
  overrides: Partial<typeof notifications.$inferInsert> = {},
) {
  await db.insert(notifications).values({
    id,
    title: "Test Notification",
    body: "This is a test notification",
    url: "/test",
    tripId: null,
    createdById: "admin-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

async function seedPushSubscription(db: DB, id: string, userId: string, token: string) {
  await db.insert(pushSubscriptions).values({
    id,
    userId,
    token,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedNotificationPush(
  db: DB,
  notificationId: string,
  targetUserId: string,
  status: string,
  failureReason?: string | null,
) {
  await db.insert(notificationPushes).values({
    notificationId,
    targetUserId,
    status,
    failureReason: failureReason ?? null,
    sentAt: status === "sent" ? new Date() : null,
  });
}

describe("NotificationService", () => {
  describe("createCoinsAddedNotification", () => {
    it("should create notification with reason", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        100,
        "Challenge completion",
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toContain("100 coins");
      expect(result.body).toContain("Challenge completion");
      expect(result.url).toBe("/trips/groups");
    });

    it("should create notification without reason", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        50,
        undefined,
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toContain("50 coins");
      expect(result.body).not.toContain("Reason:");
      expect(result.url).toBe("/trips/groups");
    });

    it("should handle zero coins", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        0,
        undefined,
      );

      expect(result.body).toContain("0 coins");
    });

    it("should handle large coin amounts", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        999999,
        undefined,
      );

      expect(result.body).toContain("999999 coins");
    });

    it("should handle special characters in group name", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test <Group> & Co.",
        100,
        undefined,
      );

      expect(result.title).toBe("💰 Test <Group> & Co. received coins!");
    });
  });

  describe("createCoinsRemovedNotification", () => {
    it("should create notification with reason", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        50,
        "Penalty",
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toContain("50 coins");
      expect(result.body).toContain("Penalty");
      expect(result.url).toBe("/trips/groups");
    });

    it("should create notification without reason", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        25,
        undefined,
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toContain("25 coins");
      expect(result.body).not.toContain("Reason:");
    });

    it("should handle zero coins removed", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        0,
        undefined,
      );

      expect(result.body).toContain("0 coins");
    });
  });

  describe("createNewMemberNotification", () => {
    it("should create notification for new member", () => {
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test Group",
        "John Doe",
      );

      expect(result.title).toBe("👥 New member in Test Group!");
      expect(result.body).toBe("John Doe joined your guild!");
      expect(result.url).toBe("/trips/groups");
    });

    it("should handle long member names", () => {
      const longName = "a".repeat(100);
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test Group",
        longName,
      );

      expect(result.body).toBe(`${longName} joined your guild!`);
    });

    it("should handle special characters in names", () => {
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test <Group>",
        "John & Jane",
      );

      expect(result.title).toBe("👥 New member in Test <Group>!");
      expect(result.body).toBe("John & Jane joined your guild!");
    });
  });

  describe("createRankingUpdateNotification", () => {
    it("should create notification for ranking update", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        3,
      );

      expect(result.title).toBe("🏆 Ranking update!");
      expect(result.body).toContain("Test Group");
      expect(result.body).toContain("3 place");
      expect(result.url).toBe("/trips/leaderboard");
    });

    it("should handle first place", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        1,
      );

      expect(result.body).toContain("1 place");
    });

    it("should handle large position numbers", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        999,
      );

      expect(result.body).toContain("999 place");
    });
  });
});

describe("sendMobileNotifications — PGLite", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
    vi.clearAllMocks();
    vi.mocked(executeWithRetry).mockImplementation(async <T>(fn: RetryFunction<T>): Promise<T> => {
      return await fn();
    });
    delete env.EXPO_ACCESS_TOKEN;
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  vi.spyOn(console, "error").mockImplementation(noop);

  it("should return failure when notification not found", async () => {
    const result = await sendMobileNotifications(testDb.db, "nonexistent-notification");

    expect(result.success).toBe(false);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should send notifications to all subscriptions when no explicit audience", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.total).toBe(1);
  });

  it("should filter by group when audienceMode is group", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Group A", "admin-1", "GRP01");
    await seedGroup(testDb.db, "group-2", "trip-1", "Group B", "admin-1", "GRP02");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-2");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedPushSubscription(testDb.db, "sub-2", "user-2", "ExponentPushToken[test-token-2]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "/test?__audience=group&__groupId=group-1",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should apply ranking templates when notification contains placeholders", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      title: "Ranking: <nazwa-grupy>",
      body: "Position: <miejsce-w-rankingu>",
    });

    await sendMobileNotifications(testDb.db, "notification-1");

    expect(applyRankingTemplate).toHaveBeenCalled();
  });

  it("should handle invalid push tokens gracefully", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "invalid-token");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should handle Expo API errors gracefully", async () => {
    vi.mocked(executeWithRetry).mockRejectedValue(new Error("Expo API error"));

    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(false);
    expect(result.failed).toBeGreaterThan(0);
  });

  it("should use EXPO_ACCESS_TOKEN when available", async () => {
    env.EXPO_ACCESS_TOKEN = "test-access-token";

    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle audience mode 'all'", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Group A", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", null);
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedPushSubscription(testDb.db, "sub-2", "user-2", "ExponentPushToken[test-token-2]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "/test?__audience=all",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(2);
  });

  it("should return early when no push subscriptions exist for explicit audience", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });
    await seedNotificationPush(testDb.db, "notification-1", "user-1", "pending");

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should handle notification without tripId", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: null });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle chunking large numbers of notifications", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    for (let i = 0; i < 250; i++) {
      const userId = `user-${i}`;
      await seedUser(testDb.db, userId);
      await seedParticipant(testDb.db, `tp-${i}`, userId, "trip-1", "group-1");
      await seedPushSubscription(
        testDb.db,
        `sub-${i}`,
        userId,
        `ExponentPushToken[test-token-${i}]`,
      );
    }

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(250);
  });

  it("should handle mixed success and failure from Expo", async () => {
    vi.mocked(executeWithRetry).mockResolvedValue([
      { status: "ok", id: "ticket-1" },
      { status: "error", message: "Invalid token", details: { error: "InvalidToken" } },
    ]);

    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedGroup(testDb.db, "group-2", "trip-1", "Group B", "admin-1", "GRP02");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-2");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedPushSubscription(testDb.db, "sub-2", "user-2", "ExponentPushToken[test-token-2]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(false);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("should handle retry logic for Expo failures", async () => {
    vi.mocked(executeWithRetry).mockImplementation(async (fn) => {
      try {
        return await fn();
      } catch {
        return await fn();
      }
    });

    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    await sendMobileNotifications(testDb.db, "notification-1");

    expect(executeWithRetry).toHaveBeenCalled();
  });

  it("should handle malformed URLs gracefully", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "not-a-valid-url",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle empty audience groupId parameter", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "/test?__audience=group&__groupId=",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle participants without groupId", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", null);
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle missing trip data gracefully", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      title: "Ranking: <nazwa-wycieczki>",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle database errors during status updates", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });

    const originalInsert = testDb.db.insert.bind(testDb.db);
    testDb.db.insert = vi.fn((table: unknown) => {
      if (table === notificationPushes) {
        throw new Error("Database error");
      }
      return originalInsert(table);
    }) as typeof testDb.db.insert;

    await expect(sendMobileNotifications(testDb.db, "notification-1")).rejects.toThrow(
      "Database error",
    );

    testDb.db.insert = originalInsert;
  });

  it("should handle unattempted users in explicit audience", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });
    await seedNotificationPush(testDb.db, "notification-1", "user-1", "pending");
    await seedNotificationPush(testDb.db, "notification-1", "user-2", "pending");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.total).toBe(2);

    const pushes = await testDb.db
      .select()
      .from(notificationPushes)
      .where(eq(notificationPushes.notificationId, "notification-1"));

    const user1Push = pushes.find((p) => p.targetUserId === "user-1");
    const user2Push = pushes.find((p) => p.targetUserId === "user-2");

    expect(user1Push?.status).toBe("sent");
    expect(user2Push?.status).toBe("failed");
  });

  it("claims its pushes before it talks to Expo, so a late dispatcher sends nothing", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });
    await seedNotificationPush(testDb.db, "notification-1", "user-1", "pending");

    const statusesWhenExpoWasCalled: string[] = [];
    vi.mocked(executeWithRetry).mockImplementation(async <T>(fn: RetryFunction<T>): Promise<T> => {
      const rows = await testDb.db
        .select()
        .from(notificationPushes)
        .where(eq(notificationPushes.notificationId, "notification-1"));
      statusesWhenExpoWasCalled.push(...rows.map((row) => row.status));
      return await fn();
    });

    const first = await sendMobileNotifications(testDb.db, "notification-1");
    expect(first.sent).toBe(1);

    // A row still "pending" at this point is the duplicate-push bug: the
    // Realtime worker would read it as unsent and deliver the same push again.
    expect(statusesWhenExpoWasCalled).toEqual(["sending"]);

    const second = await sendMobileNotifications(testDb.db, "notification-1");
    expect(second.sent).toBe(0);
    expect(statusesWhenExpoWasCalled).toHaveLength(1);
  });

  it("skips a notification another dispatcher is already sending", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", { tripId: "trip-1" });
    await seedNotificationPush(testDb.db, "notification-1", "user-1", "sending");

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.total).toBe(1);
    expect(executeWithRetry).not.toHaveBeenCalled();
  });

  it("writes down the audience it resolved for an implicitly addressed notification", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Group A", "admin-1", "GRP01");
    await seedGroup(testDb.db, "group-2", "trip-1", "Group B", "admin-1", "GRP02");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-2");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedPushSubscription(testDb.db, "sub-2", "user-2", "ExponentPushToken[test-token-2]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "/test?__audience=group&__groupId=group-1",
    });

    await sendMobileNotifications(testDb.db, "notification-1");

    const pushes = await testDb.db
      .select()
      .from(notificationPushes)
      .where(eq(notificationPushes.notificationId, "notification-1"));

    expect(pushes.map((push) => push.targetUserId)).toEqual(["user-1"]);
    expect(pushes[0]?.status).toBe("sent");
  });

  it("should handle absolute URLs in notification", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "https://example.com/test?__audience=all",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle URL with hash fragment", async () => {
    await seedUser(testDb.db, "admin-1");
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Test Group", "admin-1", "GRP01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedPushSubscription(testDb.db, "sub-1", "user-1", "ExponentPushToken[test-token-1]");
    await seedNotification(testDb.db, "notification-1", {
      tripId: "trip-1",
      url: "/test?__audience=all#section",
    });

    const result = await sendMobileNotifications(testDb.db, "notification-1");

    expect(result.success).toBe(true);
  });
});

describe("pruneUnregisteredTokens", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
    await seedUser(testDb.db, "user-1");
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it("should delete subscriptions rejected as DeviceNotRegistered", async () => {
    await seedPushSubscription(testDb.db, "sub-live", "user-1", "ExponentPushToken[live]");
    await seedPushSubscription(testDb.db, "sub-dead", "user-1", "ExponentPushToken[dead]");

    const removed = await pruneUnregisteredTokens(
      testDb.db,
      [
        { status: "ok", id: "ticket-live" },
        { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } },
      ] as never,
      [{ to: "ExponentPushToken[live]" }, { to: "ExponentPushToken[dead]" }] as never,
    );

    expect(removed).toEqual(["ExponentPushToken[dead]"]);
    const remaining = await testDb.db.select().from(pushSubscriptions);
    expect(remaining.map((row) => row.token)).toEqual(["ExponentPushToken[live]"]);
  });

  it("should keep subscriptions that failed for other reasons", async () => {
    await seedPushSubscription(testDb.db, "sub-big", "user-1", "ExponentPushToken[big]");

    const removed = await pruneUnregisteredTokens(
      testDb.db,
      [{ status: "error", message: "too big", details: { error: "MessageTooBig" } }] as never,
      [{ to: "ExponentPushToken[big]" }] as never,
    );

    expect(removed).toEqual([]);
    const remaining = await testDb.db.select().from(pushSubscriptions);
    expect(remaining).toHaveLength(1);
  });
});
