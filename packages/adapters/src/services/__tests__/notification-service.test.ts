import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  NotificationService,
  type RankingTemplateValues,
} from "../notification-service";

describe("[UNIT] NotificationService", () => {
  describe("[UNIT] static factory methods", () => {
    it("should create coins added notification", () => {
      const notification = NotificationService.createCoinsAddedNotification(
        "Test Group",
        100,
        "Bonus reward",
      );

      expect(notification.title).toBe("💰 Test Group received coins!");
      expect(notification.body).toContain("100");
      expect(notification.body).toContain("Bonus reward");
      expect(notification.url).toBe("/group/my");
    });

    it("should create coins added notification without reason", () => {
      const notification = NotificationService.createCoinsAddedNotification(
        "Test Group",
        50,
        undefined,
      );

      expect(notification.title).toBe("💰 Test Group received coins!");
      expect(notification.body).toContain("50");
      expect(notification.body).not.toContain("Reason:");
    });

    it("should create coins removed notification", () => {
      const notification = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        25,
        "Penalty",
      );

      expect(notification.title).toBe("💸 Test Group - Coins Seized");
      expect(notification.body).toContain("25");
      expect(notification.body).toContain("Penalty");
    });

    it("should create new member notification", () => {
      const notification = NotificationService.createNewMemberNotification(
        "Test Group",
        "John Doe",
      );

      expect(notification.title).toBe("👥 New member in Test Group!");
      expect(notification.body).toContain("John Doe");
      expect(notification.url).toBe("/group/my");
    });

    it("should create ranking update notification", () => {
      const notification = NotificationService.createRankingUpdateNotification(
        "Test Group",
        3,
      );

      expect(notification.title).toBe("🏆 Ranking update!");
      expect(notification.body).toContain("3 place");
      expect(notification.url).toBe("/ranking");
    });
  });

  describe("[UNIT] template utilities", () => {
    it("should create notification with correct structure", () => {
      const notification = NotificationService.createCoinsAddedNotification(
        "Guild Name",
        200,
        "Quest completion",
      );

      expect(notification).toHaveProperty("title");
      expect(notification).toHaveProperty("body");
      expect(notification).toHaveProperty("url");
      expect(typeof notification.title).toBe("string");
      expect(typeof notification.body).toBe("string");
      expect(typeof notification.url).toBe("string");
    });

    it("should include group name in title for coins notification", () => {
      const groupName = "My Awesome Guild";
      const notification = NotificationService.createCoinsAddedNotification(
        groupName,
        50,
        undefined,
      );

      expect(notification.title).toContain(groupName);
    });
  });

  describe("[UNIT] Effect integration", () => {
    it("sendMobileNotifications should return Effect", () => {
      // Create a minimal mock prisma
      const mockPrisma = {
        notification: {
          findUnique: () => Promise.resolve(null),
        },
      };

      const service = new NotificationService(
        mockPrisma as unknown as Parameters<typeof NotificationService>[0],
      );
      const effect = service.sendMobileNotifications("notification-123");

      // Verify it returns an Effect
      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should return early result when notification not found", async () => {
      const mockPrisma = {
        notification: {
          findUnique: () => Promise.resolve(null),
        },
      };

      const service = new NotificationService(
        mockPrisma as unknown as Parameters<typeof NotificationService>[0],
      );
      const result = await Effect.runPromise(
        service.sendMobileNotifications("notification-123"),
      );

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
