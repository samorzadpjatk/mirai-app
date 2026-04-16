import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryChallengeVoteGateway } from "./vote";
import { decodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type {
  ChallengeVoteDTO,
  ChallengeVoteConnectionArgs,
} from "@mirai-app/use-cases";

describe("[UNIT] InMemoryChallengeVoteGateway", () => {
  let gateway: InMemoryChallengeVoteGateway;

  const createMockVote = (
    id: string,
    votedAt: Date,
    overrides: Partial<ChallengeVoteDTO> = {},
  ): ChallengeVoteDTO => ({
    id,
    challengeId: overrides.challengeId ?? "challenge-001",
    submissionId: overrides.submissionId ?? "submission-001",
    voterId: overrides.voterId ?? "voter-001",
    votePosition: overrides.votePosition ?? 1,
    votePoints: overrides.votePoints ?? 10,
    normalizedWeight: overrides.normalizedWeight ?? 1.0,
    votedAt,
  });

  const createConnectionArgs = (
    first: number,
    after?: { id: string; createdAt: string } | null,
  ): ChallengeVoteConnectionArgs => ({
    first,
    after: after ?? null,
  });

  beforeEach(() => {
    gateway = new InMemoryChallengeVoteGateway();
  });

  describe("CRUD Operations", () => {
    it("creates a vote", async () => {
      const vote = createMockVote("vote-001", new Date());

      const result = await Effect.runPromise(gateway.create(vote));

      expect(result.id).toBe("vote-001");
      expect(result.challengeId).toBe("challenge-001");
    });

    it("creates multiple votes", async () => {
      const votes = [
        createMockVote("vote-001", new Date()),
        createMockVote("vote-002", new Date()),
      ];

      const result = await Effect.runPromise(gateway.createMany(votes));

      expect(result).toHaveLength(2);

      const found1 = await Effect.runPromise(gateway.findById("vote-001"));
      const found2 = await Effect.runPromise(gateway.findById("vote-002"));

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
    });

    it("finds vote by id", async () => {
      const vote = createMockVote("vote-001", new Date());
      await Effect.runPromise(gateway.create(vote));

      const result = await Effect.runPromise(gateway.findById("vote-001"));

      expect(result).not.toBeNull();
      expect(result?.id).toBe("vote-001");
    });

    it("returns null when vote not found", async () => {
      const result = await Effect.runPromise(gateway.findById("nonexistent"));
      expect(result).toBeNull();
    });

    it("deletes a vote", async () => {
      const vote = createMockVote("vote-001", new Date());
      await Effect.runPromise(gateway.create(vote));

      await Effect.runPromise(gateway.delete("vote-001"));

      const result = await Effect.runPromise(gateway.findById("vote-001"));
      expect(result).toBeNull();
    });
  });

  describe("Query by Challenge", () => {
    it("finds votes by challenge id", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-003", new Date(), {
          challengeId: "challenge-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeId("challenge-001"),
      );

      expect(result).toHaveLength(2);
      expect(result.every((v) => v.challengeId === "challenge-001")).toBe(true);
    });

    it("returns empty array when no votes for challenge", async () => {
      const result = await Effect.runPromise(
        gateway.findByChallengeId("nonexistent"),
      );
      expect(result).toHaveLength(0);
    });

    it("finds votes by challenge and voter", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
        }),
        createMockVote("vote-003", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeAndVoter("challenge-001", "voter-001"),
      );

      expect(result).toHaveLength(2);
      expect(result.every((v) => v.voterId === "voter-001")).toBe(true);
    });
  });

  describe("Query by Submission", () => {
    it("finds votes by submission id", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          submissionId: "submission-001",
        }),
        createMockVote("vote-002", new Date(), {
          submissionId: "submission-001",
        }),
        createMockVote("vote-003", new Date(), {
          submissionId: "submission-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findBySubmissionId("submission-001"),
      );

      expect(result).toHaveLength(2);
      expect(result.every((v) => v.submissionId === "submission-001")).toBe(
        true,
      );
    });
  });

  describe("Voting Status Checks", () => {
    it("checks if user has voted in challenge", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const hasVoted = await Effect.runPromise(
        gateway.hasVoted("challenge-001", "voter-001"),
      );
      const hasNotVoted = await Effect.runPromise(
        gateway.hasVoted("challenge-001", "voter-999"),
      );

      expect(hasVoted).toBe(true);
      expect(hasNotVoted).toBe(false);
    });

    it("checks if user has voted for specific position", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
          votePosition: 1,
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
          votePosition: 2,
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const hasVotedPosition1 = await Effect.runPromise(
        gateway.hasVotedForPosition("challenge-001", "voter-001", 1),
      );
      const hasVotedPosition3 = await Effect.runPromise(
        gateway.hasVotedForPosition("challenge-001", "voter-001", 3),
      );

      expect(hasVotedPosition1).toBe(true);
      expect(hasVotedPosition3).toBe(false);
    });

    it("gets voted positions for user in challenge", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
          votePosition: 3,
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
          votePosition: 1,
        }),
        createMockVote("vote-003", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
          votePosition: 2,
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const positions = await Effect.runPromise(
        gateway.getVotedPositions("challenge-001", "voter-001"),
      );

      expect(positions).toEqual([1, 2, 3]);
    });

    it("returns empty array when no positions voted", async () => {
      const positions = await Effect.runPromise(
        gateway.getVotedPositions("challenge-001", "voter-001"),
      );

      expect(positions).toEqual([]);
    });
  });

  describe("Bulk Delete", () => {
    it("deletes all votes for a challenge", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-003", new Date(), {
          challengeId: "challenge-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      await Effect.runPromise(gateway.deleteByChallengeId("challenge-001"));

      const challenge1Votes = await Effect.runPromise(
        gateway.findByChallengeId("challenge-001"),
      );
      const challenge2Votes = await Effect.runPromise(
        gateway.findByChallengeId("challenge-002"),
      );

      expect(challenge1Votes).toHaveLength(0);
      expect(challenge2Votes).toHaveLength(1);
    });
  });

  describe("Connection Pagination (findByChallengeIdConnection)", () => {
    it("returns empty connection when no votes", async () => {
      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection(
          "challenge-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns paginated results with hasNextPage", async () => {
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVote(
          `vote-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            challengeId: "challenge-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection(
          "challenge-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("sorts by votedAt ascending", async () => {
      const votes = [
        createMockVote("vote-001", new Date(2024, 0, 3), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-002", new Date(2024, 0, 1), {
          challengeId: "challenge-001",
        }),
        createMockVote("vote-003", new Date(2024, 0, 2), {
          challengeId: "challenge-001",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection(
          "challenge-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.nodes[0]?.id).toBe("vote-002");
      expect(result.nodes[1]?.id).toBe("vote-003");
      expect(result.nodes[2]?.id).toBe("vote-001");
    });

    it("returns subsequent page using cursor", async () => {
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVote(
          `vote-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            challengeId: "challenge-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(votes));

      const firstPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection(
          "challenge-001",
          createConnectionArgs(10),
        ),
      );

      const decodedCursor = decodeCursor(firstPage.pageInfo.endCursor!);
      const secondPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-001", {
          first: 10,
          after: decodedCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const votes = Array.from({ length: 15 }, (_, i) =>
        createMockVote(
          `vote-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            challengeId: "challenge-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection(
          "challenge-001",
          createConnectionArgs(20),
        ),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("Connection Pagination (findByChallengeAndVoterConnection)", () => {
    it("filters by challenge and voter", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
        }),
        createMockVote("vote-002", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-001",
        }),
        createMockVote("vote-003", new Date(), {
          challengeId: "challenge-001",
          voterId: "voter-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeAndVoterConnection(
          "challenge-001",
          "voter-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.every((v) => v.voterId === "voter-001")).toBe(true);
    });

    it("supports pagination for challenge and voter votes", async () => {
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVote(
          `vote-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            challengeId: "challenge-001",
            voterId: "voter-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeAndVoterConnection(
          "challenge-001",
          "voter-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("Connection Pagination (findBySubmissionIdConnection)", () => {
    it("filters by submission id", async () => {
      const votes = [
        createMockVote("vote-001", new Date(), {
          submissionId: "submission-001",
        }),
        createMockVote("vote-002", new Date(), {
          submissionId: "submission-001",
        }),
        createMockVote("vote-003", new Date(), {
          submissionId: "submission-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(
          "submission-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.edges).toHaveLength(2);
      expect(
        result.nodes.every((v) => v.submissionId === "submission-001"),
      ).toBe(true);
    });

    it("supports pagination for submission votes", async () => {
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVote(
          `vote-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            submissionId: "submission-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(
          "submission-001",
          createConnectionArgs(10),
        ),
      );

      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("Reset", () => {
    it("clears all votes on reset", async () => {
      const votes = [
        createMockVote("vote-001", new Date()),
        createMockVote("vote-002", new Date()),
      ];
      await Effect.runPromise(gateway.seed(votes));

      await Effect.runPromise(gateway.reset());

      const found = await Effect.runPromise(gateway.findById("vote-001"));
      expect(found).toBeNull();
    });
  });

  describe("Seed", () => {
    it("seeds multiple votes", async () => {
      const votes = [
        createMockVote("vote-001", new Date()),
        createMockVote("vote-002", new Date()),
      ];

      await Effect.runPromise(gateway.seed(votes));

      const found1 = await Effect.runPromise(gateway.findById("vote-001"));
      const found2 = await Effect.runPromise(gateway.findById("vote-002"));

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the InMemoryChallengeVoteGateway implementation with:
 *
 * - CRUD Operations: create, createMany, findById, delete
 * - Challenge Queries: findByChallengeId, findByChallengeAndVoter
 * - Submission Queries: findBySubmissionId
 * - Voting Status Checks:
 *   - hasVoted (any vote in challenge)
 *   - hasVotedForPosition (specific position)
 *   - getVotedPositions (sorted array of positions)
 * - Bulk Delete: deleteByChallengeId removes only matching votes
 * - Connection Pagination (Relay spec compliant):
 *   - findByChallengeIdConnection with votedAt ASC sorting
 *   - findByChallengeAndVoterConnection with voter filtering
 *   - findBySubmissionIdConnection with submission filtering
 *   - Cursor-based pagination with hasNextPage, hasPreviousPage
 *   - Edge cursors with id and createdAt encoding
 * - Reset: clears all votes
 * - Seed: bulk insert for testing setup
 *
 * Total test cases: 25+
 * All tests use beforeEach to ensure clean state between runs.
 */
