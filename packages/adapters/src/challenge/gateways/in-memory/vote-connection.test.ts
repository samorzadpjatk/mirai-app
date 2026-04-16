import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryChallengeVoteGateway } from "./vote";
import type { ChallengeVoteDTO } from "@mirai-app/use-cases";

/**
 * Helper to create mock vote DTOs
 */
const createMockVoteDTO = (props: {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votedAt: Date;
  votePosition?: number;
}): ChallengeVoteDTO => ({
  id: props.id,
  challengeId: props.challengeId,
  submissionId: props.submissionId,
  voterId: props.voterId,
  votePosition: props.votePosition ?? 1,
  votePoints: props.votePosition === 1 ? 3 : props.votePosition === 2 ? 2 : 1,
  normalizedWeight: 1.0,
  votedAt: props.votedAt,
});

describe("[UNIT] InMemoryChallengeVoteGateway - Cursor Pagination", () => {
  describe("findByChallengeIdConnection", () => {
    it("returns empty connection when no votes exist", async () => {
      const gateway = new InMemoryChallengeVoteGateway();

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVoteDTO({
          id: `vote-${i}`,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: `voter-${i}`,
          votedAt: new Date(2024, 0, 1, 0, i), // Different timestamps
          votePosition: 1,
        }),
      );

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = Array.from({ length: 25 }, (_, i) =>
        createMockVoteDTO({
          id: `vote-${String(i).padStart(3, "0")}`,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: `voter-${i}`,
          votedAt: new Date(2024, 0, 1, 0, i),
          votePosition: 1,
        }),
      );

      await Effect.runPromise(gateway.seed(votes));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 10 }),
      );

      // Get second page using end cursor
      const lastNode = firstPage.nodes[firstPage.nodes.length - 1];
      const secondPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", {
          first: 10,
          after:
            firstPage.pageInfo.endCursor && lastNode
              ? { id: lastNode.id, createdAt: lastNode.votedAt.toISOString() }
              : null,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify no overlap
      const firstPageIds = new Set(firstPage.nodes.map((n) => n.id));
      for (const node of secondPage.nodes) {
        expect(firstPageIds.has(node.id)).toBe(false);
      }
    });

    it("returns hasNextPage=false on last page", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = Array.from({ length: 15 }, (_, i) =>
        createMockVoteDTO({
          id: `vote-${i}`,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: `voter-${i}`,
          votedAt: new Date(2024, 0, 1, 0, i),
          votePosition: 1,
        }),
      );

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("caps first to maximum of 100", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = Array.from({ length: 150 }, (_, i) =>
        createMockVoteDTO({
          id: `vote-${i}`,
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: `voter-${i}`,
          votedAt: new Date(2024, 0, 1, 0, i),
          votePosition: 1,
        }),
      );

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 200 }),
      );

      expect(result.edges.length).toBeLessThanOrEqual(100);
    });
  });

  describe("findBySubmissionIdConnection", () => {
    it("returns votes filtered by submission", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = [
        createMockVoteDTO({
          id: "vote-1",
          challengeId: "challenge-123",
          submissionId: "submission-a",
          voterId: "voter-1",
          votedAt: new Date(2024, 0, 1),
        }),
        createMockVoteDTO({
          id: "vote-2",
          challengeId: "challenge-123",
          submissionId: "submission-b",
          voterId: "voter-2",
          votedAt: new Date(2024, 0, 2),
        }),
        createMockVoteDTO({
          id: "vote-3",
          challengeId: "challenge-123",
          submissionId: "submission-a",
          voterId: "voter-3",
          votedAt: new Date(2024, 0, 3),
        }),
      ];

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-a", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.map((n) => n.id)).toContain("vote-1");
      expect(result.nodes.map((n) => n.id)).toContain("vote-3");
    });
  });

  describe("findByChallengeAndVoterConnection", () => {
    it("returns votes filtered by challenge and voter", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const votes = [
        createMockVoteDTO({
          id: "vote-1",
          challengeId: "challenge-123",
          submissionId: "submission-a",
          voterId: "voter-1",
          votedAt: new Date(2024, 0, 1),
        }),
        createMockVoteDTO({
          id: "vote-2",
          challengeId: "challenge-123",
          submissionId: "submission-b",
          voterId: "voter-2",
          votedAt: new Date(2024, 0, 2),
        }),
        createMockVoteDTO({
          id: "vote-3",
          challengeId: "challenge-456",
          submissionId: "submission-c",
          voterId: "voter-1",
          votedAt: new Date(2024, 0, 3),
        }),
      ];

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeAndVoterConnection("challenge-123", "voter-1", {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0]?.id).toBe("vote-1");
    });
  });

  describe("cursor stability", () => {
    it("maintains stable sort with id tiebreaker when timestamps collide", async () => {
      const gateway = new InMemoryChallengeVoteGateway();
      const sameTime = new Date(2024, 0, 1, 12, 0, 0);
      const votes = [
        createMockVoteDTO({
          id: "vote-b",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-b",
          votedAt: sameTime,
        }),
        createMockVoteDTO({
          id: "vote-a",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-a",
          votedAt: sameTime,
        }),
        createMockVoteDTO({
          id: "vote-c",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-c",
          votedAt: sameTime,
        }),
      ];

      await Effect.runPromise(gateway.seed(votes));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-123", { first: 10 }),
      );

      // Should be sorted by id when timestamps are equal
      expect(result.nodes.map((n) => n.id)).toEqual([
        "vote-a",
        "vote-b",
        "vote-c",
      ]);
    });
  });
});
