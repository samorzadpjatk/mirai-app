import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ChallengeVote,
  validateVoteSet,
  calculateVoteStats,
} from "./ChallengeVote";
import { ChallengeVoteId } from "../value-objects/ChallengeVoteId";
import { VotePosition } from "../value-objects/VotePosition";
import { VoteWeight } from "../value-objects/VoteWeight";
import { ValidationError } from "../errors";

describe("[UNIT] ChallengeVote Entity", () => {
  describe("[UNIT] create", () => {
    it("should create a valid vote with all required fields", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.challengeId).toBe("challenge-123");
      expect(vote.submissionId).toBe("submission-456");
      expect(vote.voterId).toBe("voter-789");
      expect(vote.position.value).toBe(1);
      expect(vote.points).toBe(3); // 4 - position
      expect(vote.weight.value).toBe(1.0);
      expect(vote.votedAt).toBeInstanceOf(Date);
    });

    it("should create a vote with custom points and weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 2,
          points: 10,
          weight: 1.5,
        }),
      );

      expect(vote.points).toBe(10);
      expect(vote.weight.value).toBe(1.5);
      expect(vote.getWeightedScore()).toBe(15);
    });

    it("should create a vote with provided ID", async () => {
      const id = ChallengeVoteId.generate();
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          id,
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.id).toBe(id);
    });

    it("should create a vote with provided votedAt date", async () => {
      const votedAt = new Date("2024-01-01");
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          votedAt,
        }),
      );

      expect(vote.votedAt).toBe(votedAt);
    });

    it("should error when challengeId is empty", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "",
            submissionId: "submission-456",
            voterId: "voter-789",
            position: 1,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("challengeId");
    });

    it("should error when submissionId is empty", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "",
            voterId: "voter-789",
            position: 1,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("submissionId");
    });

    it("should error when voterId is empty", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "submission-456",
            voterId: "",
            position: 1,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("voterId");
    });

    it("should error when position is invalid", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "submission-456",
            voterId: "voter-789",
            position: 5,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("general");
    });

    it("should error when points is negative", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "submission-456",
            voterId: "voter-789",
            position: 1,
            points: -5,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("points");
    });

    it("should error when weight is not positive", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "submission-456",
            voterId: "voter-789",
            position: 1,
            weight: 0,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("general");
    });
  });

  describe("[UNIT] getWeightedScore", () => {
    it("should calculate weighted score correctly", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          points: 10,
          weight: 2.0,
        }),
      );

      expect(vote.getWeightedScore()).toBe(20);
    });

    it("should return default points with default weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 2, // 2nd place = 2 points
        }),
      );

      expect(vote.getWeightedScore()).toBe(2);
    });
  });

  describe("[UNIT] isForSubmission", () => {
    it("should return true for matching submission", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.isForSubmission("submission-456")).toBe(true);
      expect(vote.isForSubmission("other-submission")).toBe(false);
    });
  });

  describe("[UNIT] isCastBy", () => {
    it("should return true for matching voter", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.isCastBy("voter-789")).toBe(true);
      expect(vote.isCastBy("other-voter")).toBe(false);
    });
  });

  describe("[UNIT] isForChallenge", () => {
    it("should return true for matching challenge", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.isForChallenge("challenge-123")).toBe(true);
      expect(vote.isForChallenge("other-challenge")).toBe(false);
    });
  });

  describe("[UNIT] hasDefaultWeight", () => {
    it("should return true for default weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );

      expect(vote.hasDefaultWeight()).toBe(true);
    });

    it("should return false for custom weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          weight: 1.5,
        }),
      );

      expect(vote.hasDefaultWeight()).toBe(false);
    });
  });

  describe("[UNIT] getPositionDisplay", () => {
    it("should return correct display strings", async () => {
      const positions = [
        { pos: 1, expected: "1st" },
        { pos: 2, expected: "2nd" },
        { pos: 3, expected: "3rd" },
      ];

      for (const { pos, expected } of positions) {
        const vote = await Effect.runPromise(
          ChallengeVote.create({
            challengeId: "challenge-123",
            submissionId: "submission-456",
            voterId: "voter-789",
            position: pos,
          }),
        );

        expect(vote.getPositionDisplay()).toBe(expected);
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

  it("should calculate stats for votes", async () => {
    const vote1 = await Effect.runPromise(
      ChallengeVote.create({
        challengeId: "c1",
        submissionId: "s1",
        voterId: "v1",
        position: 1,
        points: 10,
        weight: 1.0,
      }),
    );

    const vote2 = await Effect.runPromise(
      ChallengeVote.create({
        challengeId: "c1",
        submissionId: "s2",
        voterId: "v2",
        position: 2,
        points: 5,
        weight: 2.0,
      }),
    );

    const votes = [vote1, vote2];

    const stats = calculateVoteStats(votes);
    expect(stats.totalVotes).toBe(2);
    expect(stats.totalScore).toBe(20); // 10*1 + 5*2
    expect(stats.averageScore).toBe(10);
  });
});
