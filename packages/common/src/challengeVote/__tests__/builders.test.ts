import { describe, expect, it } from "vitest";
import {
  buildVoteInsertValues,
  computeRequiredPositions,
  hasAllRequiredPositions,
  tallyVotes,
} from "../builders";

describe("buildVoteInsertValues", () => {
  it("builds insert values with default normalized weight", () => {
    const votes = [{ submissionId: "sub-1", votePosition: 1, votePoints: 10 }];
    const result = buildVoteInsertValues(votes, "challenge-1", "voter-1");
    expect(result).toEqual([
      {
        challengeId: "challenge-1",
        submissionId: "sub-1",
        voterId: "voter-1",
        votePosition: 1,
        votePoints: 10,
        normalizedWeight: 1.0,
      },
    ]);
  });

  it("builds insert values with custom normalized weight", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1, votePoints: 10, normalizedWeight: 1.5 },
    ];
    const result = buildVoteInsertValues(votes, "challenge-1", "voter-1");
    expect(result[0]!.normalizedWeight).toBe(1.5);
  });

  it("builds multiple insert values", () => {
    const votes = [
      { submissionId: "sub-1", votePosition: 1, votePoints: 10 },
      { submissionId: "sub-2", votePosition: 2, votePoints: 5 },
    ];
    const result = buildVoteInsertValues(votes, "challenge-1", "voter-1");
    expect(result).toHaveLength(2);
    expect(result[0]!.submissionId).toBe("sub-1");
    expect(result[1]!.submissionId).toBe("sub-2");
  });
});

describe("tallyVotes", () => {
  it("returns empty map for empty votes", () => {
    const result = tallyVotes([]);
    expect(result.size).toBe(0);
  });

  it("tallies single vote", () => {
    const votes = [{ submissionId: "sub-1", votePoints: 10, normalizedWeight: 1.0 }];
    const result = tallyVotes(votes);
    expect(result.get("sub-1")).toEqual({ count: 1, score: 10 });
  });

  it("tallies multiple votes for same submission", () => {
    const votes = [
      { submissionId: "sub-1", votePoints: 10, normalizedWeight: 1.0 },
      { submissionId: "sub-1", votePoints: 5, normalizedWeight: 1.0 },
    ];
    const result = tallyVotes(votes);
    expect(result.get("sub-1")).toEqual({ count: 2, score: 15 });
  });

  it("tallies weighted votes", () => {
    const votes = [{ submissionId: "sub-1", votePoints: 10, normalizedWeight: 1.5 }];
    const result = tallyVotes(votes);
    expect(result.get("sub-1")).toEqual({ count: 1, score: 15 });
  });

  it("tallies votes for different submissions", () => {
    const votes = [
      { submissionId: "sub-1", votePoints: 10, normalizedWeight: 1.0 },
      { submissionId: "sub-2", votePoints: 5, normalizedWeight: 1.0 },
    ];
    const result = tallyVotes(votes);
    expect(result.get("sub-1")).toEqual({ count: 1, score: 10 });
    expect(result.get("sub-2")).toEqual({ count: 1, score: 5 });
  });

  it("tallies mixed votes correctly", () => {
    const votes = [
      { submissionId: "sub-1", votePoints: 10, normalizedWeight: 1.0 },
      { submissionId: "sub-1", votePoints: 5, normalizedWeight: 2.0 },
      { submissionId: "sub-2", votePoints: 8, normalizedWeight: 1.0 },
    ];
    const result = tallyVotes(votes);
    expect(result.get("sub-1")).toEqual({ count: 2, score: 20 });
    expect(result.get("sub-2")).toEqual({ count: 1, score: 8 });
  });
});

describe("hasAllRequiredPositions", () => {
  it("returns false when requiredPositions is 0", () => {
    expect(hasAllRequiredPositions(new Set([1]), 0)).toBe(false);
  });

  it("returns false when requiredPositions is negative", () => {
    expect(hasAllRequiredPositions(new Set([1, 2, 3]), -1)).toBe(false);
  });

  it("returns true for exact match of 1 position", () => {
    expect(hasAllRequiredPositions(new Set([1]), 1)).toBe(true);
  });

  it("returns true for exact match of 3 positions", () => {
    expect(hasAllRequiredPositions(new Set([1, 2, 3]), 3)).toBe(true);
  });

  it("returns false when position 1 is missing", () => {
    expect(hasAllRequiredPositions(new Set([2, 3]), 3)).toBe(false);
  });

  it("returns false when position 2 is missing", () => {
    expect(hasAllRequiredPositions(new Set([1, 3]), 3)).toBe(false);
  });

  it("returns false when position 3 is missing", () => {
    expect(hasAllRequiredPositions(new Set([1, 2]), 3)).toBe(false);
  });

  it("returns true when positions are a superset", () => {
    expect(hasAllRequiredPositions(new Set([1, 2, 3, 4]), 3)).toBe(true);
  });

  it("returns false for empty set with requiredPositions > 0", () => {
    expect(hasAllRequiredPositions(new Set(), 1)).toBe(false);
  });

  it("returns false for empty set with requiredPositions <= 0", () => {
    expect(hasAllRequiredPositions(new Set(), 0)).toBe(false);
  });
});

describe("computeRequiredPositions", () => {
  it("returns 0 for 0 submissions", () => {
    expect(computeRequiredPositions(0)).toBe(0);
  });

  it("returns 0 for 1 submission", () => {
    expect(computeRequiredPositions(1)).toBe(0);
  });

  it("returns 2 for 2 submissions", () => {
    expect(computeRequiredPositions(2)).toBe(2);
  });

  it("returns 3 for 3 submissions", () => {
    expect(computeRequiredPositions(3)).toBe(3);
  });

  it("returns 3 for 5 submissions", () => {
    expect(computeRequiredPositions(5)).toBe(3);
  });
});
