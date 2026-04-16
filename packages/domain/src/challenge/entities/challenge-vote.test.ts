import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ChallengeVote,
  validateVoteSet,
  calculateVoteStats,
} from "./challenge-vote";
import type { ChallengeVoteId } from "../value-objects/vote-id";
import { VotePosition } from "../value-objects/vote-position";
import { VoteWeight } from "../value-objects/vote-weight";
import { ValidationError } from "../../system/errors";

describe("[UNIT] ChallengeVote", () => {
  describe("[UNIT] ChallengeVote.create", () => {
    it("creates vote with all required fields", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      const vote = await Effect.runPromise(voteEffect);
      expect(vote.challengeId).toBe("challenge-123");
      expect(vote.submissionId).toBe("submission-456");
      expect(vote.voterId).toBe("voter-789");
      expect(vote.position.value).toBe(1);
      expect(vote.points).toBe(3);
      expect(vote.weight.value).toBe(1.0);
    });

    it("fails when challengeId is empty", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("fails when challengeId is whitespace only", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "   ",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("fails when submissionId is empty", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "",
        voterId: "voter-789",
        position: 1,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("fails when voterId is empty", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "",
        position: 1,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("returns ValidationError for empty challengeId", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      });

      const result = await Effect.runPromise(Effect.either(voteEffect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("challengeId is required");
      }
    });

    it("uses position-based points when points not provided", async () => {
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote1.points).toBe(3);

      const vote2 = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-2",
          voterId: "voter-789",
          position: 2,
        }),
      );
      expect(vote2.points).toBe(2);

      const vote3 = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-3",
          voterId: "voter-789",
          position: 3,
        }),
      );
      expect(vote3.points).toBe(1);
    });

    it("uses provided points when specified", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          points: 10,
        }),
      );
      expect(vote.points).toBe(10);
    });

    it("fails for negative points", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        points: -1,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("uses default weight when weight not provided", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.weight.value).toBe(1.0);
    });

    it("uses provided weight when specified", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          weight: 1.5,
        }),
      );
      expect(vote.weight.value).toBe(1.5);
    });

    it("fails for invalid weight", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        weight: 0,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("uses provided ID when specified", async () => {
      const id = "custom-vote-id" as ChallengeVoteId;
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

    it("generates ID when not provided", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.id).toBeDefined();
      expect(typeof vote.id).toBe("string");
    });

    it("uses provided votedAt when specified", async () => {
      const votedAt = new Date("2024-01-15");
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          votedAt,
        }),
      );
      expect(vote.votedAt).toEqual(votedAt);
    });

    it("creates new Date when votedAt not provided", async () => {
      const beforeCreate = new Date();
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      const afterCreate = new Date();

      expect(vote.votedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(vote.votedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it("trims whitespace from string fields", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "  challenge-123  ",
          submissionId: "  submission-456  ",
          voterId: "  voter-789  ",
          position: 1,
        }),
      );
      expect(vote.challengeId).toBe("challenge-123");
      expect(vote.submissionId).toBe("submission-456");
      expect(vote.voterId).toBe("voter-789");
    });

    it("fails for invalid position", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 0,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });

    it("fails for position exceeding max", async () => {
      const voteEffect = ChallengeVote.create({
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 4,
      });

      const exit = await Effect.runPromiseExit(voteEffect);
      expect(exit._tag).toBe("Failure");
    });
  });

  describe("[UNIT] ChallengeVote.getWeightedScore", () => {
    it("returns points for default weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.getWeightedScore()).toBe(3);
    });

    it("calculates weighted score correctly", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          weight: 2,
        }),
      );
      expect(vote.getWeightedScore()).toBe(6);
    });

    it("handles fractional weights", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 2,
          weight: 1.5,
        }),
      );
      expect(vote.getWeightedScore()).toBe(3);
    });
  });

  describe("[UNIT] ChallengeVote.isForSubmission", () => {
    it("returns true for matching submission", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isForSubmission("submission-456")).toBe(true);
    });

    it("returns false for non-matching submission", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isForSubmission("submission-999")).toBe(false);
    });
  });

  describe("[UNIT] ChallengeVote.isCastBy", () => {
    it("returns true for matching voter", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isCastBy("voter-789")).toBe(true);
    });

    it("returns false for non-matching voter", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isCastBy("voter-999")).toBe(false);
    });
  });

  describe("[UNIT] ChallengeVote.isForChallenge", () => {
    it("returns true for matching challenge", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isForChallenge("challenge-123")).toBe(true);
    });

    it("returns false for non-matching challenge", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.isForChallenge("challenge-999")).toBe(false);
    });
  });

  describe("[UNIT] ChallengeVote.hasDefaultWeight", () => {
    it("returns true for default weight", async () => {
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

    it("returns false for non-default weight", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
          weight: 2,
        }),
      );
      expect(vote.hasDefaultWeight()).toBe(false);
    });
  });

  describe("[UNIT] ChallengeVote.getPositionDisplay", () => {
    it("returns '1st' for first place", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      expect(vote.getPositionDisplay()).toBe("1st");
    });

    it("returns '2nd' for second place", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 2,
        }),
      );
      expect(vote.getPositionDisplay()).toBe("2nd");
    });

    it("returns '3rd' for third place", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 3,
        }),
      );
      expect(vote.getPositionDisplay()).toBe("3rd");
    });
  });

  describe("[UNIT] validateVoteSet", () => {
    it("validates empty vote set with no required positions", () => {
      const result = validateVoteSet([], 0);
      expect(result.isValid).toBe(true);
    });

    it("validates single vote with position 1", () => {
      const result = validateVoteSet(
        [{ submissionId: "sub-1", position: 1 }],
        1,
      );
      expect(result.isValid).toBe(true);
    });

    it("validates complete vote set for 3 positions", () => {
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

    it("fails for duplicate submission IDs", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-1", position: 2 },
        ],
        2,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Cannot vote multiple times on the same submission",
      );
    });

    it("fails for duplicate positions", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-2", position: 1 },
        ],
        2,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Vote positions must be unique");
    });

    it("fails when position exceeds required positions", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-2", position: 4 },
        ],
        2,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Position 4 exceeds maximum allowed position (2)",
      );
    });

    it("fails when required position 1 is missing", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 2 },
          { submissionId: "sub-2", position: 3 },
        ],
        3,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Required positions not filled: 1");
    });

    it("fails when multiple required positions are missing", () => {
      const result = validateVoteSet(
        [{ submissionId: "sub-1", position: 3 }],
        3,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Required positions not filled: 1, 2");
    });

    it("fails when all required positions are missing", () => {
      const result = validateVoteSet([], 3);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Required positions not filled: 1, 2, 3");
    });

    it("validates positions in any order", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 3 },
          { submissionId: "sub-2", position: 1 },
          { submissionId: "sub-3", position: 2 },
        ],
        3,
      );
      expect(result.isValid).toBe(true);
    });

    it("handles partial vote sets correctly", () => {
      const result = validateVoteSet(
        [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-2", position: 2 },
        ],
        3,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Required positions not filled: 3");
    });
  });

  describe("[UNIT] calculateVoteStats", () => {
    it("returns zero stats for empty array", () => {
      const stats = calculateVoteStats([]);
      expect(stats.totalVotes).toBe(0);
      expect(stats.totalScore).toBe(0);
      expect(stats.averageScore).toBe(0);
    });

    it("calculates stats for single vote", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 1,
        }),
      );
      const stats = calculateVoteStats([vote]);
      expect(stats.totalVotes).toBe(1);
      expect(stats.totalScore).toBe(3);
      expect(stats.averageScore).toBe(3);
    });

    it("calculates stats for multiple votes", async () => {
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-1" as ChallengeVoteId,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-1",
          position: 1,
        }),
      );
      const vote2 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-2" as ChallengeVoteId,
          challengeId: "challenge-123",
          submissionId: "submission-2",
          voterId: "voter-2",
          position: 2,
        }),
      );
      const vote3 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-3" as ChallengeVoteId,
          challengeId: "challenge-123",
          submissionId: "submission-3",
          voterId: "voter-3",
          position: 3,
        }),
      );

      const stats = calculateVoteStats([vote1, vote2, vote3]);
      expect(stats.totalVotes).toBe(3);
      expect(stats.totalScore).toBe(6); // 3 + 2 + 1
      expect(stats.averageScore).toBe(2);
    });

    it("calculates weighted scores correctly", async () => {
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-1" as ChallengeVoteId,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-1",
          position: 1,
          weight: 2,
        }),
      );
      const vote2 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-2" as ChallengeVoteId,
          challengeId: "challenge-123",
          submissionId: "submission-2",
          voterId: "voter-2",
          position: 2,
          weight: 1.5,
        }),
      );

      const stats = calculateVoteStats([vote1, vote2]);
      expect(stats.totalVotes).toBe(2);
      expect(stats.totalScore).toBe(9); // (3 * 2) + (2 * 1.5) = 6 + 3
      expect(stats.averageScore).toBe(4.5);
    });

    it("calculates correct average with fractional scores", async () => {
      const vote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-456",
          voterId: "voter-789",
          position: 3,
          weight: 1.5,
        }),
      );
      const stats = calculateVoteStats([vote]);
      expect(stats.totalScore).toBe(1.5); // 1 * 1.5
      expect(stats.averageScore).toBe(1.5);
    });
  });
});
