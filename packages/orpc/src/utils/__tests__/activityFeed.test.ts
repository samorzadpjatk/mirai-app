import { describe, expect, it } from "vitest";
import {
  DEFAULT_PEER_VOTING_DURATION_HOURS,
  formatSubmissionDeadline,
  resolvePeerVotingDurationHours,
  resolvePodiumPoints,
} from "../activityFeed";

describe("activityFeed pure functions", () => {
  describe("DEFAULT_PEER_VOTING_DURATION_HOURS", () => {
    it("should be 24", () => {
      expect(DEFAULT_PEER_VOTING_DURATION_HOURS).toBe(24);
    });
  });

  describe("resolvePeerVotingDurationHours", () => {
    it("should return default when votingStartTime is null", () => {
      expect(resolvePeerVotingDurationHours(null, new Date())).toBe(
        DEFAULT_PEER_VOTING_DURATION_HOURS,
      );
    });

    it("should return default when votingEndTime is null", () => {
      expect(resolvePeerVotingDurationHours(new Date(), null)).toBe(
        DEFAULT_PEER_VOTING_DURATION_HOURS,
      );
    });

    it("should return default when both are null", () => {
      expect(resolvePeerVotingDurationHours(null, null)).toBe(DEFAULT_PEER_VOTING_DURATION_HOURS);
    });

    it("should return default when both are undefined", () => {
      expect(resolvePeerVotingDurationHours(undefined, undefined)).toBe(
        DEFAULT_PEER_VOTING_DURATION_HOURS,
      );
    });

    it("should return default when duration is zero", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      expect(resolvePeerVotingDurationHours(now, now)).toBe(DEFAULT_PEER_VOTING_DURATION_HOURS);
    });

    it("should return default when duration is negative", () => {
      const start = new Date("2024-01-01T14:00:00Z");
      const end = new Date("2024-01-01T12:00:00Z");
      expect(resolvePeerVotingDurationHours(start, end)).toBe(DEFAULT_PEER_VOTING_DURATION_HOURS);
    });

    it("should return 1 hour for sub-1-hour positive duration", () => {
      const start = new Date("2024-01-01T12:00:00Z");
      const end = new Date("2024-01-01T12:30:00Z");
      expect(resolvePeerVotingDurationHours(start, end)).toBe(1);
    });

    it("should return exact hours for whole-hour duration", () => {
      const start = new Date("2024-01-01T12:00:00Z");
      const end = new Date("2024-01-01T15:00:00Z");
      expect(resolvePeerVotingDurationHours(start, end)).toBe(3);
    });

    it("should round up partial hours", () => {
      const start = new Date("2024-01-01T12:00:00Z");
      const end = new Date("2024-01-01T14:30:00Z");
      expect(resolvePeerVotingDurationHours(start, end)).toBe(3);
    });

    it("should handle large durations", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const end = new Date("2024-01-03T00:00:00Z");
      expect(resolvePeerVotingDurationHours(start, end)).toBe(48);
    });
  });

  describe("formatSubmissionDeadline", () => {
    it("should return fallback string when value is null", () => {
      expect(formatSubmissionDeadline(null)).toBe("zakończenia etapu zgłoszeń");
    });

    it("should format date in Polish locale with day, month, year, hour, minute", () => {
      const date = new Date("2024-06-15T18:30:00");
      const result = formatSubmissionDeadline(date);
      expect(result).toMatch(/15[./]06[./]2024/);
      expect(result).toMatch(/18:30/);
    });

    it("should format midnight correctly", () => {
      const date = new Date("2024-01-01T00:00:00");
      const result = formatSubmissionDeadline(date);
      expect(result).toMatch(/01[./]01[./]2024/);
      expect(result).toMatch(/00:00/);
    });
  });

  describe("resolvePodiumPoints", () => {
    const baseChallenge = {
      basePoints: 100,
      firstPlacePoints: 300,
      secondPlacePoints: 200,
      thirdPlacePoints: 150,
    };

    it("should return firstPlacePoints for ranking 1", () => {
      expect(resolvePodiumPoints(baseChallenge, 1)).toBe(300);
    });

    it("should return secondPlacePoints for ranking 2", () => {
      expect(resolvePodiumPoints(baseChallenge, 2)).toBe(200);
    });

    it("should return thirdPlacePoints for ranking 3", () => {
      expect(resolvePodiumPoints(baseChallenge, 3)).toBe(150);
    });

    it("should return basePoints for ranking 4", () => {
      expect(resolvePodiumPoints(baseChallenge, 4)).toBe(100);
    });

    it("should return basePoints for ranking 0", () => {
      expect(resolvePodiumPoints(baseChallenge, 0)).toBe(100);
    });

    it("should return basePoints for negative ranking", () => {
      expect(resolvePodiumPoints(baseChallenge, -1)).toBe(100);
    });

    it("should fallback to basePoints when firstPlacePoints is null", () => {
      const challenge = { ...baseChallenge, firstPlacePoints: null };
      expect(resolvePodiumPoints(challenge, 1)).toBe(100);
    });

    it("should fallback to basePoints when secondPlacePoints is null", () => {
      const challenge = { ...baseChallenge, secondPlacePoints: null };
      expect(resolvePodiumPoints(challenge, 2)).toBe(100);
    });

    it("should fallback to basePoints when thirdPlacePoints is null", () => {
      const challenge = { ...baseChallenge, thirdPlacePoints: null };
      expect(resolvePodiumPoints(challenge, 3)).toBe(100);
    });

    it("should handle all explicit points being null", () => {
      const challenge = {
        basePoints: 50,
        firstPlacePoints: null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
      };
      expect(resolvePodiumPoints(challenge, 1)).toBe(50);
      expect(resolvePodiumPoints(challenge, 2)).toBe(50);
      expect(resolvePodiumPoints(challenge, 3)).toBe(50);
      expect(resolvePodiumPoints(challenge, 5)).toBe(50);
    });
  });
});
