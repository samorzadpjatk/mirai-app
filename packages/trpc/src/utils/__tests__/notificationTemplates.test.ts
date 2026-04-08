import { describe, expect, test } from "bun:test";
import {
  applyRankingTemplate,
  containsRankingTemplate,
  getDailyRankingScheduleTemplate,
  RANKING_TEMPLATE_PLACEHOLDERS,
} from "../notificationTemplates";

const placeholders = RANKING_TEMPLATE_PLACEHOLDERS;

describe("notificationTemplates", () => {
  describe("RANKING_TEMPLATE_PLACEHOLDERS", () => {
    test("has all required placeholders", () => {
      expect(placeholders.groupName).toBe("<nazwa-grupy>");
      expect(placeholders.rankingPosition).toBe("<miejsce-w-rankingu>");
      expect(placeholders.activeChallengesCount).toBe(
        "<liczba-aktywnych-wyzwan>",
      );
      expect(placeholders.tripName).toBe("<nazwa-wycieczki>");
      expect(placeholders.totalGroupsCount).toBe("<liczba-grup>");
      expect(placeholders.groupMembersCount).toBe("<liczba-czlonkow-grupy>");
      expect(placeholders.currentDate).toBe("<data-dzisiaj>");
      expect(placeholders.currentTime).toBe("<godzina-teraz>");
    });
  });

  describe("applyRankingTemplate", () => {
    test("replaces all placeholders with values", () => {
      const input = `Group: ${placeholders.groupName}, Position: ${placeholders.rankingPosition}`;
      const values = {
        groupName: "Test Group",
        rankingPosition: "3",
        activeChallengesCount: "5",
        tripName: "Adventure",
        totalGroupsCount: "10",
        groupMembersCount: "4",
        currentDate: "2024-01-01",
        currentTime: "12:00",
      };

      const result = applyRankingTemplate(input, values);

      expect(result).toBe("Group: Test Group, Position: 3");
      expect(result).not.toContain("<nazwa-grupy>");
      expect(result).not.toContain("<место-w-rankingu>");
    });

    test("handles template with no placeholders", () => {
      const input = "This is a plain text template";
      const values = {
        groupName: "Test",
        rankingPosition: "1",
        activeChallengesCount: "2",
        tripName: "Trip",
        totalGroupsCount: "3",
        groupMembersCount: "4",
        currentDate: "2024-01-01",
        currentTime: "12:00",
      };

      const result = applyRankingTemplate(input, values);
      expect(result).toBe("This is a plain text template");
    });

    test("handles empty string input", () => {
      const values = {
        groupName: "Test",
        rankingPosition: "1",
        activeChallengesCount: "2",
        tripName: "Trip",
        totalGroupsCount: "3",
        groupMembersCount: "4",
        currentDate: "2024-01-01",
        currentTime: "12:00",
      };

      const result = applyRankingTemplate("", values);
      expect(result).toBe("");
    });

    test("handles template with multiple same placeholders", () => {
      const input = `${placeholders.groupName} - ${placeholders.groupName}`;
      const values = {
        groupName: "Repeated",
        rankingPosition: "1",
        activeChallengesCount: "2",
        tripName: "Trip",
        totalGroupsCount: "3",
        groupMembersCount: "4",
        currentDate: "2024-01-01",
        currentTime: "12:00",
      };

      const result = applyRankingTemplate(input, values);
      expect(result).toBe("Repeated - Repeated");
    });

    test("replaces all placeholder aliases correctly", () => {
      const input = `Challenges: <liczba-aktywnych-wyzwań>`;
      const values = {
        groupName: "Group",
        rankingPosition: "1",
        activeChallengesCount: "7",
        tripName: "Trip",
        totalGroupsCount: "3",
        groupMembersCount: "4",
        currentDate: "2024-01-01",
        currentTime: "12:00",
      };

      const result = applyRankingTemplate(input, values);
      expect(result).toContain("7");
    });
  });

  describe("containsRankingTemplate", () => {
    test("returns true when template contains ranking placeholders", () => {
      const input = `Group: ${placeholders.groupName} is ranked ${placeholders.rankingPosition}`;
      expect(containsRankingTemplate(input)).toBe(true);
    });

    test("returns false for plain text without placeholders", () => {
      const input = "This is plain text with no placeholders";
      expect(containsRankingTemplate(input)).toBe(false);
    });

    test("returns true for alternative placeholder format", () => {
      const input = "Group: <nazwa_grupy>";
      expect(containsRankingTemplate(input)).toBe(true);
    });

    test("returns false for empty string", () => {
      expect(containsRankingTemplate("")).toBe(false);
    });

    test("returns true when only some aliases match", () => {
      const input = `Total groups: ${placeholders.totalGroupsCount}`;
      expect(containsRankingTemplate(input)).toBe(true);
    });
  });

  describe("getDailyRankingScheduleTemplate", () => {
    test("returns morning template for daily_morning key", () => {
      const template = getDailyRankingScheduleTemplate("daily_morning");
      expect(template.key).toBe("daily_morning");
      expect(template.hour).toBe(7);
      expect(template.minute).toBe(30);
      expect(template.notificationType).toBe("custom");
      expect(template.notificationUrl).toBe("/ranking");
    });

    test("returns evening template for daily_evening key", () => {
      const template = getDailyRankingScheduleTemplate("daily_evening");
      expect(template.key).toBe("daily_evening");
      expect(template.hour).toBe(18);
      expect(template.minute).toBe(0);
    });

    test("throws error for unknown key", () => {
      expect(() => getDailyRankingScheduleTemplate("unknown" as any)).toThrow(
        "Unknown scheduled notification template: unknown",
      );
    });

    test("morning template contains placeholders in body", () => {
      const template = getDailyRankingScheduleTemplate("daily_morning");
      expect(template.notificationBody).toContain(placeholders.groupName);
      expect(template.notificationBody).toContain(placeholders.rankingPosition);
      expect(template.notificationBody).toContain(
        placeholders.activeChallengesCount,
      );
    });

    test("evening template contains placeholders in body", () => {
      const template = getDailyRankingScheduleTemplate("daily_evening");
      expect(template.notificationBody).toContain(placeholders.groupName);
      expect(template.notificationBody).toContain(placeholders.rankingPosition);
    });
  });
});
