import { describe, it, expect } from "bun:test";
import {
  ChallengeVote,
  validateVoteSet,
  calculateVoteStats,
} from "./ChallengeVote";
import { ChallengeVoteId } from "../value-objects/ChallengeVoteId";
import { VotePosition } from "../value-objects/VotePosition";
import { VoteWeight } from "../value-objects/VoteWeight";

describe("[UNIT] ChallengeVote Entity", () => {
  describe("create", () => {
    it("should create a valid vote with all required fields", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeId).toBe("challenge-123");
        expect(result.value.submissionId).toBe("submission-456");
        expect(result.value.voterId).toBe("voter-789");
        expect(result.value.position.value).toBe(1);
        expect(result.value.points).toBe(3); // 4 - position
        expect(result.value.weight.value).toBe(1.0);
        expect(result.value.votedAt).toBeInstanceOf(Date);
      }
    });

    it("should create a vote with custom points and weight", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 2,
        points: 10,
        weight: 1.5,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.points).toBe(10);
        expect(result.value.weight.value).toBe(1.5);
        expect(result.value.getWeightedScore()).toBe(15);
      }
    });

    it("should create a vote with provided ID", () => {
      const id = ChallengeVoteId.generate();
      const result = ChallengeVote.create({
        id,
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe(id);
      }
    });

    it("should create a vote with provided votedAt date", () => {
      const votedAt = new Date("2024-01-01");
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        votedAt,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votedAt).toBe(votedAt);
      }
    });

    it("should error when challengeId is empty", () => {
      const result = ChallengeVote.create({
        challengeId: "",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("challengeId is required");
      }
    });

    it("should error when submissionId is empty", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "",
        voterId: "voter-789",
        position: 1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("submissionId is required");
      }
    });

    it("should error when voterId is empty", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "",
        position: 1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("voterId is required");
      }
    });

    it("should error when position is invalid", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 5,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid position");
      }
    });

    it("should error when points is negative", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        points: -5,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("points must be non-negative");
      }
    });

    it("should error when weight is not positive", () => {
      const result = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        weight: 0,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid weight");
      }
    });
  });

  describe("getWeightedScore", () => {
    it("should calculate weighted score correctly", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        points: 10,
        weight: 2.0,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.getWeightedScore()).toBe(20);
      }
    });

    it("should return default points with default weight", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 2, // 2nd place = 2 points
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.getWeightedScore()).toBe(2);
      }
    });
  });

  describe("isForSubmission", () => {
    it("should return true for matching submission", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.isForSubmission("submission-456")).toBe(true);
        expect(vote.value.isForSubmission("other-submission")).toBe(false);
      }
    });
  });

  describe("isCastBy", () => {
    it("should return true for matching voter", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.isCastBy("voter-789")).toBe(true);
        expect(vote.value.isCastBy("other-voter")).toBe(false);
      }
    });
  });

  describe("isForChallenge", () => {
    it("should return true for matching challenge", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.isForChallenge("challenge-123")).toBe(true);
        expect(vote.value.isForChallenge("other-challenge")).toBe(false);
      }
    });
  });

  describe("hasDefaultWeight", () => {
    it("should return true for default weight", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.hasDefaultWeight()).toBe(true);
      }
    });

    it("should return false for custom weight", () => {
      const vote = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        weight: 1.5,
      });

      expect(vote.kind).toBe("ok");
      if (vote.kind === "ok") {
        expect(vote.value.hasDefaultWeight()).toBe(false);
      }
    });
  });

  describe("getPositionDisplay", () => {
    it("should return correct display strings", () => {
      const positions = [
        { pos: 1, expected: "1st" },
        { pos: 2, expected: "2nd" },
        { pos: 3, expected: "3rd" },
      ];

      for (const { pos, expected } of positions) {
        const vote = ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: pos,
        });

        expect(vote.kind).toBe("ok");
        if (vote.kind === "ok") {
          expect(vote.value.getPositionDisplay()).toBe(expected);
        }
      }
    });
  });
});

describe("[UNIT] validateVoteSet", () => {
  it("should validate unique submissions and positions", () => {
    const result = validateVoteSet(
      [
        { submissionId: "sub-1", position: 1 },
        { submissionId: "sub-2", position: 2 },
        { submissionId: "sub-3", position: 3 },
      ],
      3,
    );

    expect(result.isValid).toBe(true);
  });

  it("should error on duplicate submissions", () => {
    const result = validateVoteSet(
      [
        { submissionId: "sub-1", position: 1 },
        { submissionId: "sub-1", position: 2 },
      ],
      2,
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Cannot vote multiple times");
  });

  it("should error on duplicate positions", () => {
    const result = validateVoteSet(
      [
        { submissionId: "sub-1", position: 1 },
        { submissionId: "sub-2", position: 1 },
      ],
      2,
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("positions must be unique");
  });

  it("should error on missing required positions", () => {
    const result = validateVoteSet(
      [
        { submissionId: "sub-1", position: 1 },
        { submissionId: "sub-2", position: 3 },
      ],
      3,
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Required positions not filled: 2");
  });

  it("should error when position exceeds required positions", () => {
    const result = validateVoteSet(
      [
        { submissionId: "sub-1", position: 1 },
        { submissionId: "sub-2", position: 5 },
      ],
      3,
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exceeds maximum allowed position");
  });
});

describe("[UNIT] calculateVoteStats", () => {
  it("should calculate stats for empty array", () => {
    const stats = calculateVoteStats([]);
    expect(stats.totalVotes).toBe(0);
    expect(stats.totalScore).toBe(0);
    expect(stats.averageScore).toBe(0);
  });

  it("should calculate stats for votes", () => {
    const votes = [
      ChallengeVote.create({
        challengeId: "c1",
        submissionId: "s1",
        voterId: "v1",
        position: 1,
        points: 10,
        weight: 1.0,
      }),
      ChallengeVote.create({
        challengeId: "c1",
        submissionId: "s2",
        voterId: "v2",
        position: 2,
        points: 5,
        weight: 2.0,
      }),
    ]
      .filter((r) => r.kind === "ok")
      .map((r) => (r.kind === "ok" ? r.value : null))
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const stats = calculateVoteStats(votes);
    expect(stats.totalVotes).toBe(2);
    expect(stats.totalScore).toBe(20); // 10*1 + 5*2
    expect(stats.averageScore).toBe(10);
  });
});
