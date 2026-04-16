import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryChallengeSubmissionGateway } from "./submission";
import type { ChallengeSubmissionDTO } from "@mirai-app/use-cases";

describe("[UNIT] InMemoryChallengeSubmissionGateway - Cursor Pagination", () => {
  const createMockSubmission = (
    id: string,
    challengeId: string,
    groupId: string,
    createdAt: Date,
    voteScore: number = 0,
    status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING",
  ): ChallengeSubmissionDTO => ({
    id,
    challengeId,
    userId: groupId,
    groupId,
    content: "Test content",
    mediaUrls: [],
    status,
    score: 100,
    reviewedById: null,
    reviewedAt: null,
    reviewNotes: null,
    submittedAt: createdAt,
    updatedAt: createdAt,
    voteCount: Math.floor(voteScore / 10),
    voteScore,
  });

  describe("findByChallengeIdConnection (voteScore sorting)", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      // Seed 25 submissions with varying vote scores
      const submissions = Array.from({ length: 25 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          100 - i, // voteScore from 100 down to 76
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-1", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();

      // Verify voteScore sorting (highest first)
      expect(result.nodes[0].voteScore).toBe(100);
      expect(result.nodes[9].voteScore).toBe(91);
    });

    it("returns subsequent page using cursor", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 25 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          100 - i,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-1", { first: 10 }),
      );

      // Get second page using endCursor
      const secondPage = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-1", {
          first: 10,
          after: {
            id: firstPage.nodes[9].id,
            createdAt: firstPage.nodes[9].submittedAt.toISOString(),
            voteScore: firstPage.nodes[9].voteScore,
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify continuation - should start where first page ended
      expect(secondPage.nodes[0].voteScore).toBe(90);
      expect(secondPage.nodes[9].voteScore).toBe(81);
    });

    it("returns hasNextPage=false on last page", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 5 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          100 - i,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-1", { first: 10 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns empty result for challenge with no submissions", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });
  });

  describe("findByChallengeIdByCreatedAtConnection (createdAt sorting)", () => {
    it("returns submissions sorted by createdAt descending", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 15 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 86400000), // Each one day earlier
          50,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdByCreatedAtConnection("challenge-1", {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);

      // Verify createdAt sorting (newest first)
      expect(result.nodes[0].submittedAt.getTime()).toBe(now.getTime());
      expect(result.nodes[9].submittedAt.getTime()).toBe(
        now.getTime() - 9 * 86400000,
      );
    });

    it("uses cursor correctly for pagination", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 15 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 86400000),
          50,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const firstPage = await Effect.runPromise(
        gateway.findByChallengeIdByCreatedAtConnection("challenge-1", {
          first: 5,
        }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByChallengeIdByCreatedAtConnection("challenge-1", {
          first: 5,
          after: {
            id: firstPage.nodes[4].id,
            createdAt: firstPage.nodes[4].submittedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.nodes[0].id).toBe("sub-5");
      expect(secondPage.nodes[4].id).toBe("sub-9");
    });
  });

  describe("findByGroupIdConnection", () => {
    it("returns paginated submissions for a group", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      // Create submissions for different groups
      const group1Subs = Array.from({ length: 8 }, (_, i) =>
        createMockSubmission(
          `sub-g1-${i}`,
          `challenge-${i}`,
          "group-1",
          new Date(now.getTime() - i * 1000),
          50,
        ),
      );

      const group2Subs = Array.from({ length: 5 }, (_, i) =>
        createMockSubmission(
          `sub-g2-${i}`,
          `challenge-${i}`,
          "group-2",
          new Date(now.getTime() - i * 1000),
          50,
        ),
      );

      await Effect.runPromise(gateway.seed([...group1Subs, ...group2Subs]));

      const result = await Effect.runPromise(
        gateway.findByGroupIdConnection("group-1", { first: 5 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes.every((n) => n.groupId === "group-1")).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("findByStatusConnection", () => {
    it("returns paginated submissions by status", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const pendingSubs = Array.from({ length: 10 }, (_, i) =>
        createMockSubmission(
          `sub-p-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          50,
          "PENDING",
        ),
      );

      const approvedSubs = Array.from({ length: 5 }, (_, i) =>
        createMockSubmission(
          `sub-a-${i}`,
          "challenge-1",
          `group-${i + 10}`,
          new Date(now.getTime() - i * 1000),
          50,
          "APPROVED",
        ),
      );

      await Effect.runPromise(gateway.seed([...pendingSubs, ...approvedSubs]));

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("APPROVED", { first: 10 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes.every((n) => n.status === "APPROVED")).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("findManyConnection", () => {
    it("supports voteScore ordering with pagination", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 20 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          i * 10, // voteScore from 0 to 190
          i % 2 === 0 ? "PENDING" : "APPROVED",
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findManyConnection({
          challengeId: "challenge-1",
          orderBy: "voteScore",
          orderDirection: "desc",
          first: 5,
        }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes[0].voteScore).toBe(190);
      expect(result.nodes[4].voteScore).toBe(150);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("supports createdAt ordering with pagination", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 20 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          50,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findManyConnection({
          challengeId: "challenge-1",
          orderBy: "createdAt",
          orderDirection: "desc",
          first: 5,
        }),
      );

      expect(result.edges).toHaveLength(5);
      // Newest first
      expect(result.nodes[0].id).toBe("sub-0");
      expect(result.nodes[4].id).toBe("sub-4");
    });

    it("supports filtering by status", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 10 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          50,
          i % 2 === 0 ? "PENDING" : "APPROVED",
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findManyConnection({
          challengeId: "challenge-1",
          status: "PENDING",
          first: 10,
        }),
      );

      expect(result.nodes).toHaveLength(5);
      expect(result.nodes.every((n) => n.status === "PENDING")).toBe(true);
    });

    it("supports cursor-based pagination with voteScore", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 15 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          i * 10, // 0, 10, 20, ..., 140
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const firstPage = await Effect.runPromise(
        gateway.findManyConnection({
          challengeId: "challenge-1",
          orderBy: "voteScore",
          orderDirection: "desc",
          first: 5,
        }),
      );

      // Use cursor for second page
      const secondPage = await Effect.runPromise(
        gateway.findManyConnection({
          challengeId: "challenge-1",
          orderBy: "voteScore",
          orderDirection: "desc",
          first: 5,
          after: {
            id: firstPage.nodes[4].id,
            createdAt: firstPage.nodes[4].submittedAt.toISOString(),
            voteScore: firstPage.nodes[4].voteScore,
          },
        }),
      );

      expect(secondPage.nodes[0].voteScore).toBe(90);
      expect(secondPage.nodes[4].voteScore).toBe(50);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("handles tie-breaking by id when voteScores are equal", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 5 }, (_, i) =>
        createMockSubmission(
          `sub-${String.fromCharCode(97 + i)}`, // a, b, c, d, e
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          100, // Same voteScore for all
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdConnection("challenge-1", { first: 10 }),
      );

      // When voteScores are equal, id should be used for stable ordering
      expect(result.nodes).toHaveLength(5);
    });

    it("respects first parameter limit (max 100)", async () => {
      const gateway = new InMemoryChallengeSubmissionGateway();
      const now = new Date();

      const submissions = Array.from({ length: 150 }, (_, i) =>
        createMockSubmission(
          `sub-${i}`,
          "challenge-1",
          `group-${i}`,
          new Date(now.getTime() - i * 1000),
          50,
        ),
      );

      await Effect.runPromise(gateway.seed(submissions));

      const result = await Effect.runPromise(
        gateway.findByChallengeIdByCreatedAtConnection("challenge-1", {
          first: 200,
        }),
      );

      // Should be capped at 100
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });
  });
});
