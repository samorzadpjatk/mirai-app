import { describe, expect, it } from "vitest";
import {
  resolveRequiredVotePositions,
  validateNoSelfVoting,
  validateVotePayload,
  validateVotePositionConflict,
  validateVotePositionsRange,
} from "../validators";

describe("validateVotePayload", () => {
  it("returns null for unique submissionIds and positions", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1 },
      { submissionId: "sub-2", votePosition: 2 },
    ];
    const result = validateVotePayload(votes);
    expect(result).toBeNull();
  });

  it("returns error for duplicate submissionIds", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1 },
      { submissionId: "sub-1", votePosition: 2 },
    ];
    const result = validateVotePayload(votes);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie",
    });
  });

  it("returns error for duplicate positions", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1 },
      { submissionId: "sub-2", votePosition: 1 },
    ];
    const result = validateVotePayload(votes);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Pozycje glosow musza byc unikalne",
    });
  });

  it("returns null for empty votes array", () => {
    const result = validateVotePayload([]);
    expect(result).toBeNull();
  });

  it("returns error for both duplicate submissionIds and positions", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1 },
      { submissionId: "sub-1", votePosition: 1 },
    ];
    const result = validateVotePayload(votes);
    // Should catch submissionId duplication first
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie",
    });
  });
});

describe("validateNoSelfVoting", () => {
  it("returns null when participant has no group", () => {
    const submissions = [{ id: "sub-1", groupId: "group-1" }];
    const result = validateNoSelfVoting(submissions, null);
    expect(result).toBeNull();
  });

  it("returns null when participant group has no submission", () => {
    const submissions = [{ id: "sub-1", groupId: "group-1" }];
    const result = validateNoSelfVoting(submissions, "group-2");
    expect(result).toBeNull();
  });

  it("returns error when participant votes on own group submission", () => {
    const submissions = [
      { id: "sub-1", groupId: "group-1" },
      { id: "sub-2", groupId: "group-2" },
    ];
    const result = validateNoSelfVoting(submissions, "group-1");
    expect(result).toEqual({
      error: "FORBIDDEN",
      message: "Nie mozna glosowac na wlasna grupe",
    });
  });

  it("returns null for empty submissions", () => {
    const result = validateNoSelfVoting([], "group-1");
    expect(result).toBeNull();
  });
});

describe("validateVotePositionConflict", () => {
  it("returns null when no existing votes", () => {
    const result = validateVotePositionConflict([], 1, "sub-1", "PEER_VOTING");
    expect(result).toBeNull();
  });

  it("returns conflict for PEER_VOTING with any existing vote", () => {
    const existing = [{ id: "vote-1", votePosition: 1, submissionId: "sub-1" }];
    const result = validateVotePositionConflict(existing, 2, "sub-2", "PEER_VOTING");
    expect(result).toEqual({
      error: "CONFLICT",
      message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
    });
  });

  it("returns conflict for duplicate position in JUDGED_STAFF", () => {
    const existing = [{ id: "vote-1", votePosition: 1, submissionId: "sub-1" }];
    const result = validateVotePositionConflict(existing, 1, "sub-2", "JUDGED_STAFF");
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Pozycja glosu jest juz zajeta",
    });
  });

  it("returns conflict for duplicate vote (same position + same submission)", () => {
    const existing = [{ id: "vote-1", votePosition: 1, submissionId: "sub-1" }];
    const result = validateVotePositionConflict(existing, 1, "sub-1", "JUDGED_STAFF");
    expect(result).toEqual({
      error: "CONFLICT",
      message: "Glos juz istnieje",
    });
  });

  it("returns null for new position in JUDGED_STAFF", () => {
    const existing = [{ id: "vote-1", votePosition: 1, submissionId: "sub-1" }];
    const result = validateVotePositionConflict(existing, 2, "sub-2", "JUDGED_STAFF");
    expect(result).toBeNull();
  });
});

describe("validateVotePositionsRange", () => {
  it("returns null for valid positions", () => {
    const result = validateVotePositionsRange([1, 2], 3, false);
    expect(result).toBeNull();
  });

  it("returns error when requiredPositions is 0", () => {
    const result = validateVotePositionsRange([1], 0, false);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "At least 2 eligible submissions are required for staff voting",
    });
  });

  it("returns error when position exceeds requiredPositions", () => {
    const result = validateVotePositionsRange([1, 4], 3, false);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Staff voting accepts only positions 1-3",
    });
  });

  it("returns error when exact count is required but count is wrong", () => {
    const result = validateVotePositionsRange([1], 3, true);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Staff voting requires exactly 3 votes",
    });
  });

  it("returns null when exact count matches", () => {
    const result = validateVotePositionsRange([1, 2, 3], 3, true);
    expect(result).toBeNull();
  });
});

describe("resolveRequiredVotePositions", () => {
  it("returns 0 required positions for fewer than 2 submissions", () => {
    const result = resolveRequiredVotePositions(1);
    expect(result).toEqual({ requiredPositions: 0, eligibleSubmissionsCount: 1 });
  });

  it("returns 2 required positions for 2 submissions", () => {
    const result = resolveRequiredVotePositions(2);
    expect(result).toEqual({ requiredPositions: 2, eligibleSubmissionsCount: 2 });
  });

  it("returns 3 required positions for 3 submissions", () => {
    const result = resolveRequiredVotePositions(3);
    expect(result).toEqual({ requiredPositions: 3, eligibleSubmissionsCount: 3 });
  });

  it("returns 3 required positions for more than 3 submissions", () => {
    const result = resolveRequiredVotePositions(5);
    expect(result).toEqual({ requiredPositions: 3, eligibleSubmissionsCount: 5 });
  });

  it("returns 0 required positions for 0 submissions", () => {
    const result = resolveRequiredVotePositions(0);
    expect(result).toEqual({ requiredPositions: 0, eligibleSubmissionsCount: 0 });
  });
});
