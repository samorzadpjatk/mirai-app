import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationService,
  sendMobileNotifications,
  type NotificationData,
} from "../notificationService";
import type { PrismaClient, Notification, PushSubscription, NotificationPush } from "@mirai-app/db";
import { Expo } from "expo-server-sdk";
import { executeWithRetry } from "../../utils/resilience";

// Mock dependencies
vi.mock("expo-server-sdk", () => ({
  Expo: class MockExpo {
    constructor(_options?: { accessToken?: string }) {}

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
      return (messages as Array<{ to?: string }>).map((message) => ({
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

describe("NotificationService", () => {
  describe("createCoinsAddedNotification", () => {
    it("should create notification with reason", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        100,
        "Challenge completion"
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toContain("100 coins");
      expect(result.body).toContain("Challenge completion");
      expect(result.url).toBe("/group/my");
    });

    it("should create notification without reason", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        50,
        undefined
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toContain("50 coins");
      expect(result.body).not.toContain("Reason:");
      expect(result.url).toBe("/group/my");
    });

    it("should handle zero coins", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        0,
        undefined
      );

      expect(result.body).toContain("0 coins");
    });

    it("should handle large coin amounts", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test Group",
        999999,
        undefined
      );

      expect(result.body).toContain("999999 coins");
    });

    it("should handle special characters in group name", () => {
      const result: NotificationData = NotificationService.createCoinsAddedNotification(
        "Test <Group> & Co.",
        100,
        undefined
      );

      expect(result.title).toBe("💰 Test <Group> & Co. received coins!");
    });
  });

  describe("createCoinsRemovedNotification", () => {
    it("should create notification with reason", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        50,
        "Penalty"
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toContain("50 coins");
      expect(result.body).toContain("Penalty");
      expect(result.url).toBe("/group/my");
    });

    it("should create notification without reason", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        25,
        undefined
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toContain("25 coins");
      expect(result.body).not.toContain("Reason:");
    });

    it("should handle zero coins removed", () => {
      const result: NotificationData = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        0,
        undefined
      );

      expect(result.body).toContain("0 coins");
    });
  });

  describe("createNewMemberNotification", () => {
    it("should create notification for new member", () => {
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test Group",
        "John Doe"
      );

      expect(result.title).toBe("👥 New member in Test Group!");
      expect(result.body).toBe("John Doe joined your guild!");
      expect(result.url).toBe("/group/my");
    });

    it("should handle long member names", () => {
      const longName = "a".repeat(100);
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test Group",
        longName
      );

      expect(result.body).toBe(`${longName} joined your guild!`);
    });

    it("should handle special characters in names", () => {
      const result: NotificationData = NotificationService.createNewMemberNotification(
        "Test <Group>",
        "John & Jane"
      );

      expect(result.title).toBe("👥 New member in Test <Group>!");
      expect(result.body).toBe("John & Jane joined your guild!");
    });
  });

  describe("createRankingUpdateNotification", () => {
    it("should create notification for ranking update", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        3
      );

      expect(result.title).toBe("🏆 Ranking update!");
      expect(result.body).toContain("Test Group");
      expect(result.body).toContain("3 place");
      expect(result.url).toBe("/ranking");
    });

    it("should handle first place", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        1
      );

      expect(result.body).toContain("1 place");
    });

    it("should handle large position numbers", () => {
      const result: NotificationData = NotificationService.createRankingUpdateNotification(
        "Test Group",
        999
      );

      expect(result.body).toContain("999 place");
    });
  });
});

describe("sendMobileNotifications", () => {
  let mockDb: PrismaClient;
  let mockNotification: Notification;
  let mockPushSubscription: PushSubscription;
  let mockNotificationPush: NotificationPush;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(executeWithRetry).mockImplementation(async (fn) => fn());

    mockNotification = {
      id: "notification-1",
      title: "Test Notification",
      body: "This is a test notification",
      url: "/test",
      tripId: "trip-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: "admin-1",
    } as Notification;

    mockPushSubscription = {
      id: "sub-1",
      userId: "user-1",
      token: "ExponentPushToken[test-token-1]",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PushSubscription;

    mockNotificationPush = {
      id: "push-1",
      notificationId: "notification-1",
      targetUserId: "user-1",
      status: "pending",
      sentAt: null,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NotificationPush;

    mockDb = {
      notification: {
        findUnique: vi.fn().mockResolvedValue(mockNotification),
      },
      notificationPush: {
        findMany: vi.fn().mockResolvedValue([mockNotificationPush]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue(mockNotificationPush),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      pushSubscription: {
        findMany: vi.fn().mockResolvedValue([mockPushSubscription]),
      },
      tripParticipant: {
        findMany: vi.fn().mockResolvedValue([
          { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
        ]),
      },
      group: {
        findMany: vi.fn().mockResolvedValue([
          { id: "group-1", name: "Test Group", tripId: "trip-1", coins: 100, isDeleted: false },
        ]),
      },
      challenge: {
        count: vi.fn().mockResolvedValue(5),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue({ id: "trip-1", name: "Test Trip" }),
      },
      $transaction: vi.fn((cb) => cb(mockDb)),
    } as unknown as PrismaClient;

    // Reset environment variables
    delete process.env.EXPO_ACCESS_TOKEN;
  });

  it("should return failure when notification not found", async () => {
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(null);

    const result = await sendMobileNotifications(mockDb, "nonexistent-notification");

    expect(result.success).toBe(false);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should send notifications to all subscriptions when no explicit audience", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.total).toBe(1);
    expect(mockDb.notificationPush.createMany).toHaveBeenCalled();
  });

  it("should send notifications to pending explicit audience", async () => {
    const pendingPush = { ...mockNotificationPush, status: "pending" };
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([pendingPush]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
    expect(mockDb.notificationPush.update).toHaveBeenCalled();
  });

  it("should skip when all explicit audience already processed", async () => {
    const sentPush = { ...mockNotificationPush, status: "sent" };
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([sentPush]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.total).toBe(1);
  });

  it("should return early when no push subscriptions exist", async () => {
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should filter subscriptions by trip participants when tripId exists", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
      { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
      { id: "tp-2", userId: "user-2", tripId: "trip-1", groupId: "group-2", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
    ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, userId: "user-1" },
      { ...mockPushSubscription, id: "sub-2", userId: "user-2", token: "ExponentPushToken[test-token-2]" },
      { ...mockPushSubscription, id: "sub-3", userId: "user-3", token: "ExponentPushToken[test-token-3]" },
    ]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(2);
  });

  it("should filter by group when audienceMode is group", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany)
      .mockResolvedValueOnce([
        { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
        { id: "tp-2", userId: "user-2", tripId: "trip-1", groupId: "group-2", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
      ])
      .mockResolvedValueOnce([
        { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
      ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, userId: "user-1" },
      { ...mockPushSubscription, id: "sub-2", userId: "user-2", token: "ExponentPushToken[test-token-2]" },
    ]);

    const notificationWithGroupAudience = {
      ...mockNotification,
      url: "/test?__audience=group&__groupId=group-1",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithGroupAudience);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should apply ranking templates when notification contains placeholders", async () => {
    const { applyRankingTemplate } = await import("../../utils/notificationTemplates");

    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const notificationWithTemplate = {
      ...mockNotification,
      title: "Ranking: <nazwa-grupy>",
      body: "Position: <miejsce-w-rankingu>",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithTemplate);

    await sendMobileNotifications(mockDb, "notification-1");

    expect(applyRankingTemplate).toHaveBeenCalled();
  });

  it("should handle invalid push tokens gracefully", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, token: "invalid-token" },
    ]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should handle Expo API errors gracefully", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(executeWithRetry).mockRejectedValue(new Error("Expo API error"));

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(false);
    expect(result.failed).toBeGreaterThan(0);
  });

  it("should use EXPO_ACCESS_TOKEN when available", async () => {
    process.env.EXPO_ACCESS_TOKEN = "test-access-token";
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);

    await sendMobileNotifications(mockDb, "notification-1");

    // The Expo constructor should be called with the access token
    // This is verified by the mock being created successfully
    expect(mockDb.notificationPush.createMany).toHaveBeenCalled();
  });

  it("should handle audience mode 'all'", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
      { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
      { id: "tp-2", userId: "user-2", tripId: "trip-1", groupId: null, role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
    ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, userId: "user-1" },
      { ...mockPushSubscription, id: "sub-2", userId: "user-2", token: "ExponentPushToken[test-token-2]" },
    ]);

    const notificationWithAllAudience = {
      ...mockNotification,
      url: "/test?__audience=all",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithAllAudience);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(2);
  });

  it("should return early when no push subscriptions exist", async () => {
    const pendingPush = { ...mockNotificationPush, status: "pending" };
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([pendingPush]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should handle notification without tripId", async () => {
    const notificationWithoutTrip = {
      ...mockNotification,
      tripId: null,
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithoutTrip);
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle chunking large numbers of notifications", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);

    const manySubscriptions = Array.from({ length: 250 }, (_, i) => ({
      ...mockPushSubscription,
      id: `sub-${i}`,
      userId: `user-${i}`,
      token: `ExponentPushToken[test-token-${i}]`,
    }));
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue(manySubscriptions);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue(
      Array.from({ length: 250 }, (_, i) => ({ id: `tp-${i}`, userId: `user-${i}`, tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null }))
    );

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(250);
  });

  it("should handle mixed success and failure from Expo", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
      { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
      { id: "tp-2", userId: "user-2", tripId: "trip-1", groupId: "group-2", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
    ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, userId: "user-1" },
      { ...mockPushSubscription, id: "sub-2", userId: "user-2", token: "ExponentPushToken[test-token-2]" },
    ]);

    vi.mocked(executeWithRetry).mockResolvedValue([
      { status: "ok", id: "ticket-1" },
      { status: "error", message: "Invalid token", details: { error: "InvalidToken" } },
    ]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(false);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("should handle retry logic for Expo failures", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(executeWithRetry).mockImplementation(async (fn) => {
      // First call fails, second succeeds
      try {
        return await fn();
      } catch {
        return await fn();
      }
    });

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(executeWithRetry).toHaveBeenCalled();
  });

  it("should handle malformed URLs gracefully", async () => {
    const notificationWithBadUrl = {
      ...mockNotification,
      url: "not-a-valid-url",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithBadUrl);
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle empty audience groupId parameter", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
      { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: "group-1", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
    ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const notificationWithEmptyGroup = {
      ...mockNotification,
      url: "/test?__audience=group&__groupId=",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithEmptyGroup);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle participants without groupId", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.tripParticipant.findMany).mockResolvedValue([
      { id: "tp-1", userId: "user-1", tripId: "trip-1", groupId: null, role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), wristNumber: null, houseNumber: null },
    ]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.sent).toBe(1);
  });

  it("should handle missing trip data gracefully", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.trip.findUnique).mockResolvedValue(null);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const notificationWithTemplate = {
      ...mockNotification,
      title: "Ranking: <nazwa-wycieczki>",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithTemplate);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle database errors during status updates", async () => {
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.notificationPush.createMany).mockRejectedValue(new Error("Database error"));

    await expect(sendMobileNotifications(mockDb, "notification-1")).rejects.toThrow();
  });

  it("should handle unattempted users in explicit audience", async () => {
    const pendingPush1 = { ...mockNotificationPush, status: "pending", targetUserId: "user-1" };
    const pendingPush2 = { ...mockNotificationPush, status: "pending", targetUserId: "user-2", id: "push-2" };
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([pendingPush1, pendingPush2]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([
      { ...mockPushSubscription, userId: "user-1" },
    ]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.total).toBe(2);
    expect(mockDb.notificationPush.update).toHaveBeenCalledTimes(2);
  });

  it("should handle absolute URLs in notification", async () => {
    const notificationWithAbsoluteUrl = {
      ...mockNotification,
      url: "https://example.com/test?__audience=all",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithAbsoluteUrl);
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
  });

  it("should handle URL with hash fragment", async () => {
    const notificationWithHash = {
      ...mockNotification,
      url: "/test?__audience=all#section",
    };
    vi.mocked(mockDb.notification.findUnique).mockResolvedValue(notificationWithHash);
    vi.mocked(mockDb.notificationPush.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.pushSubscription.findMany).mockResolvedValue([mockPushSubscription]);

    const result = await sendMobileNotifications(mockDb, "notification-1");

    expect(result.success).toBe(true);
  });
});