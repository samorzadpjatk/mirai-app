import { describe, it, expect } from "@jest/globals";
import {
  resolvePeerVotingDurationHours,
  formatSubmissionDeadline,
  resolvePodiumPoints,
  DEFAULT_PEER_VOTING_DURATION_HOURS,
} from "@mirai-app/orpc/utils/activityFeed";

describe("resolvePeerVotingDurationHours", () => {
  it("should return default when times are null", () => {
    expect(resolvePeerVotingDurationHours(null, null)).toBe(DEFAULT_PEER_VOTING_DURATION_HOURS);
    expect(resolvePeerVotingDurationHours(undefined, undefined)).toBe(
      DEFAULT_PEER_VOTING_DURATION_HOURS,
    );
  });

  it("should calculate hours from duration", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T12:00:00Z");
    expect(resolvePeerVotingDurationHours(start, end)).toBe(12);
  });

  it("should return default for zero or negative duration", () => {
    const start = new Date("2024-01-01T12:00:00Z");
    const end = new Date("2024-01-01T00:00:00Z");
    expect(resolvePeerVotingDurationHours(start, end)).toBe(DEFAULT_PEER_VOTING_DURATION_HOURS);
  });

  it("should return at least 1 hour for short durations", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T00:30:00Z");
    expect(resolvePeerVotingDurationHours(start, end)).toBe(1);
  });
});

describe("formatSubmissionDeadline", () => {
  it("should return default text for null", () => {
    expect(formatSubmissionDeadline(null)).toBe("zakończenia etapu zgłoszeń");
  });

  it("should format a date", () => {
    const result = formatSubmissionDeadline(new Date("2024-01-15T14:30:00Z"));
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });
});

describe("resolvePodiumPoints", () => {
  const challenge = {
    basePoints: 10,
    firstPlacePoints: 50,
    secondPlacePoints: 30,
    thirdPlacePoints: 20,
  };

  it("should return first place points", () => {
    expect(resolvePodiumPoints(challenge, 1)).toBe(50);
  });

  it("should return second place points", () => {
    expect(resolvePodiumPoints(challenge, 2)).toBe(30);
  });

  it("should return third place points", () => {
    expect(resolvePodiumPoints(challenge, 3)).toBe(20);
  });

  it("should fallback to base points for unknown ranking", () => {
    expect(resolvePodiumPoints(challenge, 4)).toBe(10);
  });

  it("should fallback to base points when place points are null", () => {
    const incomplete = {
      basePoints: 10,
      firstPlacePoints: null as unknown as undefined,
      secondPlacePoints: null as unknown as undefined,
      thirdPlacePoints: null as unknown as undefined,
    };
    expect(resolvePodiumPoints(incomplete, 1)).toBe(10);
  });
});
