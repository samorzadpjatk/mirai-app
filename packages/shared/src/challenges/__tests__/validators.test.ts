import { describe, expect, it } from "vitest";
import { MAX_PEER_VOTING_DURATION_HOURS } from "../dateUtils";
import { validatePeerVotingTimeline, validateRecurringTimeline } from "../validators";

describe("validatePeerVotingTimeline", () => {
  it("returns valid for non-peer-voting challenges", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "TEXT",
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("returns valid for IMAGE peer voting", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date("2024-06-15T18:00:00Z"),
      votingDurationHours: 5,
    });
    expect(result.valid).toBe(true);
  });

  it("returns valid for VIDEO peer voting", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "VIDEO",
      scoringCategory: "PEER_VOTING",
      endTime: new Date("2024-06-15T18:00:00Z"),
      votingDurationHours: 5,
    });
    expect(result.valid).toBe(true);
  });

  it("returns error for non-image/video peer voting", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "TEXT",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingDurationHours: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Peer voting is supported only for IMAGE or VIDEO challenges");
  });

  it("returns error when endTime is missing", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      votingDurationHours: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Peer voting challenge requires submission end time");
  });

  it("returns error when neither duration nor window provided", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Peer voting challenge requires voting duration in hours or days",
    );
  });

  it("returns valid with voting window instead of duration", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingStartTime: new Date("2024-06-15T18:00:00Z"),
      votingEndTime: new Date("2024-06-16T18:00:00Z"),
    });
    expect(result.valid).toBe(true);
  });

  it("returns error for invalid voting duration (zero)", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingDurationHours: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
    );
  });

  it("returns error for invalid voting duration (negative)", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingDurationHours: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
    );
  });

  it("returns error for invalid voting duration (decimal)", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingDurationHours: 1.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
    );
  });

  it("returns error for voting duration exceeding max", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingDurationHours: MAX_PEER_VOTING_DURATION_HOURS + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
    );
  });

  it("returns error when voting start is after end", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingStartTime: new Date("2024-06-16T18:00:00Z"),
      votingEndTime: new Date("2024-06-15T18:00:00Z"),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Voting start time must be before voting end time");
  });

  it("returns error when voting start equals end", () => {
    const sameTime = new Date("2024-06-15T18:00:00Z");
    const result = validatePeerVotingTimeline({
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(),
      votingStartTime: sameTime,
      votingEndTime: sameTime,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Voting start time must be before voting end time");
  });

  it("returns multiple errors when multiple issues exist", () => {
    const result = validatePeerVotingTimeline({
      submissionType: "TEXT",
      scoringCategory: "PEER_VOTING",
      votingDurationHours: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);
  });
});

describe("validateRecurringTimeline", () => {
  it("returns valid when not recurring", () => {
    const result = validateRecurringTimeline({
      isRecurring: false,
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("returns valid for recurring with all required fields", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      recurringDays: 5,
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(true);
  });

  it("returns error when dailyStartTime is missing", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyEndTime: "18:00",
      recurringDays: 5,
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recurring challenge requires daily start and end time");
  });

  it("returns error when dailyEndTime is missing", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyStartTime: "09:00",
      recurringDays: 5,
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recurring challenge requires daily start and end time");
  });

  it("returns error when recurringDays is missing", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recurring challenge requires number of days");
  });

  it("returns error when recurringDays is zero", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      recurringDays: 0,
      scoringCategory: "SPEED",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recurring challenge requires number of days");
  });

  it("returns error for peer voting recurring", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      recurringDays: 5,
      scoringCategory: "PEER_VOTING",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recurring peer voting challenges are not supported");
  });

  it("returns multiple errors when multiple issues exist", () => {
    const result = validateRecurringTimeline({
      isRecurring: true,
      scoringCategory: "PEER_VOTING",
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);
  });
});
