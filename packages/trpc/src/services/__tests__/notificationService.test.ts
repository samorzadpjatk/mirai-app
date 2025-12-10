import { describe, it, expect } from "vitest";
import { NotificationService } from "~/services/notificationService";

describe("NotificationService", () => {
  describe("createCoinsAddedNotification", () => {
    it("should create notification with reason", () => {
      const result = NotificationService.createCoinsAddedNotification(
        "Test Group",
        100,
        "Good work!"
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toContain("Your guild received 100 coins!");
      expect(result.body).toContain("Reason: Good work!");
      expect(result.url).toBe("/group/my");
    });

    it("should create notification without reason", () => {
      const result = NotificationService.createCoinsAddedNotification(
        "Test Group",
        50,
        undefined
      );

      expect(result.title).toBe("💰 Test Group received coins!");
      expect(result.body).toBe(
        "Your guild received 50 coins!\nClick me to see your balance!"
      );
      expect(result.url).toBe("/group/my");
    });
  });

  describe("createCoinsRemovedNotification", () => {
    it("should create notification with reason", () => {
      const result = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        30,
        "Rule violation"
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toContain("Your guild lost 30 coins!");
      expect(result.body).toContain("Reason: Rule violation");
      expect(result.url).toBe("/group/my");
    });

    it("should create notification without reason", () => {
      const result = NotificationService.createCoinsRemovedNotification(
        "Test Group",
        20,
        undefined
      );

      expect(result.title).toBe("💸 Test Group - Coins Seized");
      expect(result.body).toBe(
        "Your guild lost 20 coins!\nClick me to see your balance!"
      );
      expect(result.url).toBe("/group/my");
    });
  });

  describe("createNewMemberNotification", () => {
    it("should create new member notification", () => {
      const result = NotificationService.createNewMemberNotification(
        "Test Group",
        "John Doe"
      );

      expect(result.title).toBe("👥 New member in Test Group!");
      expect(result.body).toBe("John Doe joined your guild!");
      expect(result.url).toBe("/group/my");
    });
  });

  describe("createRankingUpdateNotification", () => {
    it("should create ranking update notification", () => {
      const result = NotificationService.createRankingUpdateNotification(
        "Test Group",
        1
      );

      expect(result.title).toBe("🏆 Ranking update!");
      expect(result.body).toBe(
        "Test Group now holds 1 place in the ranking! Click me to check the current ranking."
      );
      expect(result.url).toBe("/ranking");
    });

    it("should handle different positions", () => {
      const result = NotificationService.createRankingUpdateNotification(
        "Another Group",
        5
      );

      expect(result.body).toContain("5 place");
    });
  });
});
