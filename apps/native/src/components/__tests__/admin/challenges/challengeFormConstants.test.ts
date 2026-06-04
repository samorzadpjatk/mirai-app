import { describe, expect, it } from "@jest/globals";
import {
  DAY_MS,
  formatIso,
  formatTime,
  inferRecurringDaysFromWindow,
  newChallengeStatusOptions,
  scoringCategories,
  statusOptions,
  submissionTypes,
  toOptionalInt,
  toVotingDurationDraft,
  toVotingDurationHours,
} from "~/components/admin/challenges/challengeFormConstants";

describe("challengeFormConstants", () => {
  describe("submissionTypes", () => {
    it("should contain all expected submission types", () => {
      expect(submissionTypes.map((s) => s.value)).toEqual([
        "IMAGE",
        "VIDEO",
        "TEXT",
        "IMAGE_LOCATION",
        "LOCATION",
        "QR_CODE",
      ]);
    });
  });

  describe("scoringCategories", () => {
    it("should contain all expected scoring categories", () => {
      expect(scoringCategories.map((s) => s.value)).toEqual([
        "SPEED",
        "UNLIMITED",
        "JUDGED_STAFF",
        "PEER_VOTING",
      ]);
    });
  });

  describe("statusOptions", () => {
    it("should contain all expected status options", () => {
      expect(statusOptions.map((s) => s.value)).toEqual([
        "HIDDEN",
        "VISIBLE",
        "ACTIVE",
        "VOTING_PHASE",
        "COMPLETED",
        "CANCELLED",
      ]);
    });
  });

  describe("newChallengeStatusOptions", () => {
    it("should only contain HIDDEN and VISIBLE", () => {
      expect(newChallengeStatusOptions.map((s) => s.value)).toEqual(["HIDDEN", "VISIBLE"]);
    });
  });

  describe("toVotingDurationHours", () => {
    it("should convert hours value directly", () => {
      expect(toVotingDurationHours("5", "HOURS")).toBe(5);
    });

    it("should convert days to hours", () => {
      expect(toVotingDurationHours("3", "DAYS")).toBe(72);
    });

    it("should return undefined for invalid input", () => {
      expect(toVotingDurationHours("", "HOURS")).toBeUndefined();
      expect(toVotingDurationHours("abc", "HOURS")).toBeUndefined();
      expect(toVotingDurationHours("0", "HOURS")).toBeUndefined();
      expect(toVotingDurationHours("-1", "HOURS")).toBeUndefined();
    });
  });

  describe("toVotingDurationDraft", () => {
    it("should return empty draft when inputs are missing", () => {
      expect(toVotingDurationDraft(null, null)).toEqual({
        value: "",
        unit: "HOURS",
      });
      expect(toVotingDurationDraft(undefined, undefined)).toEqual({
        value: "",
        unit: "HOURS",
      });
    });

    it("should return empty draft when end is before start", () => {
      const start = new Date("2024-01-02T00:00:00Z");
      const end = new Date("2024-01-01T00:00:00Z");
      expect(toVotingDurationDraft(start, end)).toEqual({
        value: "",
        unit: "HOURS",
      });
    });

    it("should calculate hours for short durations", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-01T05:00:00Z");
      expect(toVotingDurationDraft(start, end)).toEqual({
        value: "5",
        unit: "HOURS",
      });
    });

    it("should calculate days for exact 24h multiples", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-03T00:00:00Z");
      expect(toVotingDurationDraft(start, end)).toEqual({
        value: "2",
        unit: "DAYS",
      });
    });

    it("should round up partial hours to next whole hour", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-01T00:30:00Z");
      expect(toVotingDurationDraft(start, end)).toEqual({
        value: "1",
        unit: "HOURS",
      });
    });
  });

  describe("formatTime", () => {
    it("should format date to HH:MM using local time", () => {
      const date = new Date(2024, 0, 1, 9, 5);
      expect(formatTime(date)).toBe("09:05");
    });

    it("should pad single digits", () => {
      const date = new Date(2024, 0, 1, 1, 2);
      expect(formatTime(date)).toBe("01:02");
    });

    it("should return empty string for null", () => {
      expect(formatTime(null)).toBe("");
    });
  });

  describe("formatIso", () => {
    it("should return ISO string for valid date", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      expect(formatIso(date)).toBe(date.toISOString());
    });

    it("should return empty string for null", () => {
      expect(formatIso(null)).toBe("");
    });
  });

  describe("DAY_MS", () => {
    it("should equal 86400000", () => {
      expect(DAY_MS).toBe(86400000);
    });
  });

  describe("inferRecurringDaysFromWindow", () => {
    it("should return empty string when inputs are missing", () => {
      expect(inferRecurringDaysFromWindow(null, null)).toBe("");
      expect(inferRecurringDaysFromWindow(undefined, undefined)).toBe("");
    });

    it("should return empty string when end is before start", () => {
      const start = new Date("2024-01-02T00:00:00Z");
      const end = new Date("2024-01-01T00:00:00Z");
      expect(inferRecurringDaysFromWindow(start, end)).toBe("");
    });

    it("should calculate days between two dates inclusive", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-03T00:00:00Z");
      expect(inferRecurringDaysFromWindow(start, end)).toBe("3");
    });

    it("should calculate single day", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-01T00:00:00Z");
      expect(inferRecurringDaysFromWindow(start, end)).toBe("1");
    });
  });

  describe("toOptionalInt", () => {
    it("should parse valid integer", () => {
      expect(toOptionalInt("42")).toBe(42);
    });

    it("should return undefined for empty string", () => {
      expect(toOptionalInt("")).toBeUndefined();
    });

    it("should return undefined for invalid input", () => {
      expect(toOptionalInt("abc")).toBeUndefined();
    });
  });
});
