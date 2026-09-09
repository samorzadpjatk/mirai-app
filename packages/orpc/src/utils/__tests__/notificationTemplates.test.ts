import { describe, expect, it } from "vitest";
import {
  DAILY_RANKING_SCHEDULE_TEMPLATES,
  RANKING_TEMPLATE_PLACEHOLDERS,
  type RankingTemplateValues,
  applyRankingTemplate,
  containsRankingTemplate,
  getDailyRankingScheduleTemplate,
} from "../notificationTemplates";

describe("notificationTemplates", () => {
  describe("DAILY_RANKING_SCHEDULE_TEMPLATES", () => {
    it("should contain daily_morning template", () => {
      const template = DAILY_RANKING_SCHEDULE_TEMPLATES.find((t) => t.key === "daily_morning");
      expect(template).toBeDefined();
      expect(template?.hour).toBe(7);
      expect(template?.minute).toBe(30);
      expect(template?.notificationType).toBe("custom");
    });

    it("should contain daily_evening template", () => {
      const template = DAILY_RANKING_SCHEDULE_TEMPLATES.find((t) => t.key === "daily_evening");
      expect(template).toBeDefined();
      expect(template?.hour).toBe(18);
      expect(template?.minute).toBe(0);
      expect(template?.notificationType).toBe("custom");
    });

    it("should have correct notification URLs", () => {
      DAILY_RANKING_SCHEDULE_TEMPLATES.forEach((template) => {
        expect(template.notificationUrl).toBe("/trips/leaderboard");
      });
    });

    it("should have Polish titles and bodies", () => {
      DAILY_RANKING_SCHEDULE_TEMPLATES.forEach((template) => {
        expect(template.notificationTitle).toBeTruthy();
        expect(template.notificationBody).toBeTruthy();
        expect(template.notificationBody).toContain(RANKING_TEMPLATE_PLACEHOLDERS.groupName);
      });
    });
  });

  describe("RANKING_TEMPLATE_PLACEHOLDERS", () => {
    it("should have all required placeholders", () => {
      expect(RANKING_TEMPLATE_PLACEHOLDERS.groupName).toBe("<nazwa-grupy>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition).toBe("<miejsce-w-rankingu>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.activeChallengesCount).toBe("<liczba-aktywnych-wyzwan>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.tripName).toBe("<nazwa-wycieczki>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.totalGroupsCount).toBe("<liczba-grup>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.groupMembersCount).toBe("<liczba-czlonkow-grupy>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.currentDate).toBe("<data-dzisiaj>");
      expect(RANKING_TEMPLATE_PLACEHOLDERS.currentTime).toBe("<godzina-teraz>");
    });
  });

  describe("getDailyRankingScheduleTemplate", () => {
    it("should return daily_morning template", () => {
      const template = getDailyRankingScheduleTemplate("daily_morning");
      expect(template.key).toBe("daily_morning");
      expect(template.name).toBe("Daily ranking update (07:30)");
    });

    it("should return daily_evening template", () => {
      const template = getDailyRankingScheduleTemplate("daily_evening");
      expect(template.key).toBe("daily_evening");
      expect(template.name).toBe("Daily ranking update (18:00)");
    });

    it("should throw error for unknown template key", () => {
      expect(() => getDailyRankingScheduleTemplate("unknown_key" as "daily_morning")).toThrow(
        "Unknown scheduled notification template: unknown_key",
      );
    });
  });

  describe("applyRankingTemplate", () => {
    const mockValues: RankingTemplateValues = {
      groupName: "Test Group",
      rankingPosition: "3",
      activeChallengesCount: "5",
      tripName: "Summer Trip",
      totalGroupsCount: "10",
      groupMembersCount: "4",
      currentDate: "2024-01-15",
      currentTime: "14:30",
    };

    it("should replace all standard placeholders", () => {
      const input = `Group: ${RANKING_TEMPLATE_PLACEHOLDERS.groupName}, Rank: ${RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition}`;
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("Group: Test Group, Rank: 3");
    });

    it("should replace all placeholders in template", () => {
      const input = Object.values(RANKING_TEMPLATE_PLACEHOLDERS).join(" ");
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toContain("Test Group");
      expect(result).toContain("3");
      expect(result).toContain("5");
      expect(result).toContain("Summer Trip");
      expect(result).toContain("10");
      expect(result).toContain("4");
      expect(result).toContain("2024-01-15");
      expect(result).toContain("14:30");
    });

    it("should handle text without placeholders", () => {
      const input = "Plain text without placeholders";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("Plain text without placeholders");
    });

    it("should handle empty string", () => {
      const result = applyRankingTemplate("", mockValues);
      expect(result).toBe("");
    });

    it("should replace underscore aliases for groupName", () => {
      const input = "<nazwa_grupy>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("Test Group");
    });

    it("should replace underscore aliases for rankingPosition", () => {
      const input = "<miejsce_w_rankingu>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("3");
    });

    it("should replace multiple aliases for activeChallengesCount", () => {
      const input = "<liczba-aktywnych-wyzwań> <liczba_aktywnych_wyzwan> <liczba_aktywnych_wyzwań>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("5 5 5");
    });

    it("should replace underscore aliases for tripName", () => {
      const input = "<nazwa_wycieczki>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("Summer Trip");
    });

    it("should replace underscore aliases for totalGroupsCount", () => {
      const input = "<liczba_grup>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("10");
    });

    it("should replace multiple aliases for groupMembersCount", () => {
      const input = "<liczba-członków-grupy> <liczba_czlonkow_grupy> <liczba_członków_grupy>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("4 4 4");
    });

    it("should replace underscore aliases for currentDate", () => {
      const input = "<data_dzisiaj>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("2024-01-15");
    });

    it("should replace underscore aliases for currentTime", () => {
      const input = "<godzina_teraz>";
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("14:30");
    });

    it("should handle multiple occurrences of same placeholder", () => {
      const input = `${RANKING_TEMPLATE_PLACEHOLDERS.groupName} and ${RANKING_TEMPLATE_PLACEHOLDERS.groupName}`;
      const result = applyRankingTemplate(input, mockValues);
      expect(result).toBe("Test Group and Test Group");
    });

    it("should handle real template from DAILY_RANKING_SCHEDULE_TEMPLATES", () => {
      const template = getDailyRankingScheduleTemplate("daily_morning");
      const result = applyRankingTemplate(template.notificationBody, mockValues);
      expect(result).toContain("Test Group");
      expect(result).toContain("3");
      expect(result).toContain("5");
      expect(result).not.toContain("<nazwa-grupy>");
      expect(result).not.toContain("<miejsce-w-rankingu>");
    });
  });

  describe("containsRankingTemplate", () => {
    it("should return true for string with placeholders", () => {
      const input = `Hello ${RANKING_TEMPLATE_PLACEHOLDERS.groupName}`;
      expect(containsRankingTemplate(input)).toBe(true);
    });

    it("should return true for string with underscore aliases", () => {
      const input = "Hello <nazwa_grupy>";
      expect(containsRankingTemplate(input)).toBe(true);
    });

    it("should return false for plain text", () => {
      const input = "Hello world";
      expect(containsRankingTemplate(input)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(containsRankingTemplate("")).toBe(false);
    });

    it("should return true for template from DAILY_RANKING_SCHEDULE_TEMPLATES", () => {
      const template = getDailyRankingScheduleTemplate("daily_morning");
      expect(containsRankingTemplate(template.notificationBody)).toBe(true);
    });

    it("should return false for string with similar but non-matching patterns", () => {
      const input = "<some-other-pattern>";
      expect(containsRankingTemplate(input)).toBe(false);
    });

    it("should return true for any valid placeholder alias", () => {
      expect(containsRankingTemplate("<nazwa-grupy>")).toBe(true);
      expect(containsRankingTemplate("<nazwa_grupy>")).toBe(true);
      expect(containsRankingTemplate("<miejsce-w-rankingu>")).toBe(true);
      expect(containsRankingTemplate("<miejsce_w_rankingu>")).toBe(true);
      expect(containsRankingTemplate("<liczba-aktywnych-wyzwan>")).toBe(true);
      expect(containsRankingTemplate("<liczba_aktywnych_wyzwan>")).toBe(true);
    });
  });
});
